<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\TransactionReceiptMail;
use App\Models\Transaction;
use App\Services\TransactionReceiptDataService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Spatie\LaravelPdf\Enums\Format;
use Spatie\LaravelPdf\Facades\Pdf;
use Throwable;

final class SendTransactionReceiptJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly int $transactionId,
        public readonly string $recipient,
        public readonly string $deliveryId,
    ) {
        $this->onConnection((string) config('queue.receipt_email_connection', 'redis-pdf'));
        $this->onQueue((string) config('queue.receipt_email_queue', 'pdf-generation'));
    }

    /**
     * Execute the job.
     */
    public function handle(TransactionReceiptDataService $receiptDataService): void
    {
        $transaction = Transaction::query()->findOrFail($this->transactionId);
        $receipt = $receiptDataService->build($transaction);
        $pdfBytes = base64_decode(
            Pdf::view('pdf.transaction-receipt', ['receipt' => $receipt])
                ->format(Format::A4)
                ->base64(),
            true,
        );

        if ($pdfBytes === false) {
            throw new RuntimeException('Unable to generate the receipt PDF.');
        }

        Mail::to($this->recipient)->send(new TransactionReceiptMail($receipt, $pdfBytes));

        Transaction::query()
            ->whereKey($this->transactionId)
            ->where('receipt_email_delivery_id', $this->deliveryId)
            ->update([
                'receipt_email_status' => 'sent',
                'receipt_email_recipient' => $this->recipient,
                'receipt_emailed_at' => now(),
                'receipt_email_failed_at' => null,
                'receipt_email_error' => null,
            ]);
    }

    public function failed(Throwable $throwable): void
    {
        Log::error('Transaction receipt delivery failed permanently.', [
            'transaction_id' => $this->transactionId,
            'delivery_id' => $this->deliveryId,
            'exception' => $throwable,
        ]);

        Transaction::query()
            ->whereKey($this->transactionId)
            ->where('receipt_email_delivery_id', $this->deliveryId)
            ->update([
                'receipt_email_status' => 'failed',
                'receipt_email_recipient' => $this->recipient,
                'receipt_email_failed_at' => now(),
                'receipt_email_error' => 'The receipt email could not be delivered after multiple attempts.',
            ]);
    }

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [5, 30, 120];
    }
}

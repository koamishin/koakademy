<?php

declare(strict_types=1);

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;
use Override;

final class PasskeyFieldForm extends Field
{
    #[Override]
    protected string $view = 'filament.forms.components.passkey-field-form';
}

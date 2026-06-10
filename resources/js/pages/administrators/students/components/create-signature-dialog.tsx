import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Eraser, ImageUp, PencilLine, Save, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { toast } from "sonner";

interface CreateSignatureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (file: File, previewUrl: string) => void;
}

export function CreateSignatureDialog({ open, onOpenChange, onSave }: CreateSignatureDialogProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const signaturePadRef = useRef<SignaturePad | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("draw");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { actualTheme } = useTheme();

    const resetUploadState = useCallback(() => {
        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
        setUploadFile(null);
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [uploadPreview]);

    const initializePad = useCallback(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper || !open || activeTab !== "draw") return;

        const rect = wrapper.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width <= 0 || height <= 0) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const context = canvas.getContext("2d");
        if (!context) return;
        context.scale(ratio, ratio);

        const dark = document.documentElement.classList.contains("dark");
        signaturePadRef.current = new SignaturePad(canvas, {
            minWidth: 1.2,
            maxWidth: 2.8,
            penColor: dark ? "rgb(255,255,255)" : "rgb(15,23,42)",
            backgroundColor: "rgba(255,255,255,0)",
        });
    }, [open, activeTab]);

    // Initialize and auto-focus canvas when dialog opens in draw mode
    useEffect(() => {
        if (!open || activeTab !== "draw") return;

        const timer = setTimeout(() => {
            requestAnimationFrame(() => {
                initializePad();
                // Auto-focus canvas so pointer is captured immediately
                canvasRef.current?.focus();
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            signaturePadRef.current?.off();
            signaturePadRef.current = null;
        };
    }, [open, actualTheme, activeTab, initializePad]);

    // Handle resize
    useEffect(() => {
        if (!open || activeTab !== "draw") return;
        const handleResize = () => {
            const existingStrokeData = signaturePadRef.current?.toData() ?? [];
            requestAnimationFrame(() => {
                initializePad();
                if (existingStrokeData.length > 0 && signaturePadRef.current) {
                    signaturePadRef.current.fromData(existingStrokeData);
                }
            });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [open, activeTab, initializePad]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // ESC to close
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleDialogClose(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const handleDialogClose = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            resetUploadState();
            setActiveTab("draw");
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be smaller than 5MB.");
            return;
        }
        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
        setUploadFile(file);
        setUploadPreview(URL.createObjectURL(file));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    };

    const handleClear = () => {
        signaturePadRef.current?.clear();
    };

    const normalizeToDarkInk = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = sourceCanvas.width;
        tempCanvas.height = sourceCanvas.height;
        const tempContext = tempCanvas.getContext("2d");
        if (!tempContext) return sourceCanvas;
        tempContext.drawImage(sourceCanvas, 0, 0);
        const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0) {
                pixels[i] = 30;
                pixels[i + 1] = 41;
                pixels[i + 2] = 59;
            }
        }
        tempContext.putImageData(imageData, 0, 0);
        return tempCanvas;
    };

    const normalizeUploadToDarkInk = (file: File): Promise<HTMLCanvasElement> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = img.naturalWidth;
                tempCanvas.height = img.naturalHeight;
                const ctx = tempCanvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                }
                const normalized = normalizeToDarkInk(tempCanvas);
                URL.revokeObjectURL(img.src);
                resolve(normalized);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleSave = () => {
        if (activeTab === "upload") {
            if (!uploadFile) {
                toast.error("Please select an image to upload.");
                return;
            }
            setSaving(true);
            normalizeUploadToDarkInk(uploadFile).then((normalizedCanvas) => {
                normalizedCanvas.toBlob((blob) => {
                    if (!blob) {
                        setSaving(false);
                        toast.error("Unable to generate signature file.");
                        return;
                    }
                    const signatureFile = new File([blob], "signature.png", { type: "image/png" });
                    const previewUrl = normalizedCanvas.toDataURL("image/png");
                    onSave(signatureFile, previewUrl);
                    setSaving(false);
                    handleDialogClose(false);
                }, "image/png");
            });
            return;
        }

        const signaturePad = signaturePadRef.current;
        const canvas = canvasRef.current;
        if (!signaturePad || !canvas) {
            toast.error("Signature pad is not ready yet.");
            return;
        }
        if (signaturePad.isEmpty()) {
            toast.error("Please provide a signature before saving.");
            return;
        }

        setSaving(true);
        const normalizedCanvas = normalizeToDarkInk(canvas);
        normalizedCanvas.toBlob((blob) => {
            if (!blob) {
                setSaving(false);
                toast.error("Unable to generate signature file.");
                return;
            }
            const signatureFile = new File([blob], "signature.png", { type: "image/png" });
            const previewUrl = normalizedCanvas.toDataURL("image/png");
            onSave(signatureFile, previewUrl);
            setSaving(false);
            handleDialogClose(false);
        }, "image/png");
    };

    if (!open) return null;

    return (
        <div className="bg-background fixed inset-0 z-50 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
                {/* Top bar */}
                <div className="border-muted/40 flex shrink-0 items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-semibold">Student Signature</h2>
                        <TabsList>
                            <TabsTab value="draw" className="gap-1.5">
                                <PencilLine className="h-3.5 w-3.5" />
                                Draw
                            </TabsTab>
                            <TabsTab value="upload" className="gap-1.5">
                                <ImageUp className="h-3.5 w-3.5" />
                                Upload
                            </TabsTab>
                        </TabsList>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleDialogClose(false)} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Canvas area - fills remaining space */}
                <TabsPanel value="draw" className="flex-1">
                    <div className="relative flex h-full flex-col">
                        {/* Guide text - shown when canvas is empty */}
                        <div className="text-muted-foreground/30 pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-medium select-none">
                            Sign here
                        </div>
                        <div ref={wrapperRef} className="flex-1 cursor-crosshair touch-none">
                            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" tabIndex={0} />
                        </div>
                    </div>
                </TabsPanel>

                {/* Upload area */}
                <TabsPanel value="upload" className="flex-1">
                    {uploadPreview ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className="relative flex h-full items-center justify-center bg-white p-8 dark:bg-zinc-900"
                        >
                            <img src={uploadPreview} alt="Upload preview" className="max-h-full max-w-full object-contain" />
                            <button
                                type="button"
                                onClick={resetUploadState}
                                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "bg-muted/20 text-muted-foreground flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 transition-colors",
                                isDragOver ? "border-primary/50 bg-primary/5 text-primary" : "hover:bg-muted/30",
                            )}
                        >
                            <ImageUp className={cn("transition-all", isDragOver ? "text-primary h-14 w-14" : "h-12 w-12")} />
                            <span className="text-lg font-medium">{isDragOver ? "Drop image here" : "Click or drag an image to upload"}</span>
                            <span className="text-sm">PNG, JPG, or SVG up to 5MB</span>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </TabsPanel>

                {/* Bottom toolbar */}
                <div className="border-muted/40 flex shrink-0 items-center justify-between border-t px-6 py-4">
                    <div className="flex items-center gap-2">
                        {activeTab === "draw" && (
                            <Button type="button" variant="outline" onClick={handleClear} disabled={saving}>
                                <Eraser className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        )}
                        <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)} disabled={saving}>
                            Cancel
                        </Button>
                    </div>
                    <Button type="button" size="lg" onClick={handleSave} disabled={saving} className="min-w-[140px]">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Saving..." : "Save Signature"}
                    </Button>
                </div>
            </Tabs>
        </div>
    );
}

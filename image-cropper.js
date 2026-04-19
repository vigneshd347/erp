// Global Image Cropper Utility using Cropper.js
// Loads Cropper.js on demand and provides a unified image interception logic

let cropperJsLoaded = false;
let cropperInstance = null;
let currentResolve = null;
let currentReject = null;

function loadCropperDependency() {
    return new Promise((resolve, reject) => {
        if (cropperJsLoaded || window.Cropper) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
        script.onload = () => {
            cropperJsLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function initCropperUI() {
    if (document.getElementById('manti-cropper-modal')) return;

    const modalHtml = `
        <div id="manti-cropper-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:999999; flex-direction:column;">
            <div style="flex:1; width:100%; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:10px;">
                <img id="manti-cropper-image" style="max-width:100%; max-height:100%; object-fit:contain;">
            </div>
            <div style="height:80px; background:#111; display:flex; align-items:center; justify-content:space-between; padding:0 20px;">
                <button type="button" id="manti-cropper-cancel" style="background:transparent; color:#fff; border:none; font-size:1.1rem; padding:10px; cursor:pointer;">Cancel</button>
                <button type="button" id="manti-cropper-done" style="background:#3b82f6; color:#fff; border:none; padding:10px 24px; border-radius:6px; font-weight:600; font-size:1rem; cursor:pointer;">Crop & Save</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('manti-cropper-cancel').addEventListener('click', () => {
        closeCropper(null);
    });

    document.getElementById('manti-cropper-done').addEventListener('click', () => {
        if (cropperInstance) {
            // Compress and output canvas
            const canvas = cropperInstance.getCroppedCanvas({
                maxWidth: 1200,
                maxHeight: 1200,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            if (canvas) {
                canvas.toBlob((blob) => {
                    closeCropper(blob);
                }, 'image/jpeg', 0.85); // JPEG compression 85%
            } else {
                closeCropper(null);
            }
        }
    });
}

function closeCropper(blob) {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    const modal = document.getElementById('manti-cropper-modal');
    if (modal) modal.style.display = 'none';
    
    if (currentResolve) {
        if (blob) {
            currentResolve(blob);
        } else {
            if (currentReject) currentReject(new Error('User cancelled crop'));
        }
        currentResolve = null;
        currentReject = null;
    }
}

/**
 * Main Interface to open the generic cropper.
 * @param {File} file - The raw file from input.files[0]
 * @param {Number} aspectRatio - Optional aspect ratio (1 = square). Default is NaN (free).
 * @returns {Promise<File>} - Resolves with the cropped File object with same name.
 */
window.openCropper = async function(file, aspectRatio = NaN) {
    if (!file || !file.type.startsWith('image/')) {
        return Promise.reject(new Error('Not an image file.'));
    }

    try {
        await loadCropperDependency();
        initCropperUI();

        const objectUrl = URL.createObjectURL(file);
        const imageElement = document.getElementById('manti-cropper-image');
        const modal = document.getElementById('manti-cropper-modal');
        
        imageElement.src = objectUrl;
        modal.style.display = 'flex';

        return new Promise((resolve, reject) => {
            currentResolve = (blob) => {
                // Reconstruct a strict File object to emulate original input
                const newFile = new File([blob], file.name ? file.name.replace(/\.[^/.]+$/, "") + ".jpg" : "cropped_image.jpg", {
                    type: "image/jpeg",
                    lastModified: new Date().getTime()
                });
                URL.revokeObjectURL(objectUrl);
                resolve(newFile);
            };
            currentReject = (err) => {
                URL.revokeObjectURL(objectUrl);
                reject(err);
            };

            // Needs slight delay for DOM measurement
            setTimeout(() => {
                cropperInstance = new Cropper(imageElement, {
                    aspectRatio: aspectRatio,
                    viewMode: 1, // Restrict crop box to canvas
                    dragMode: 'move',
                    autoCropArea: 0.95,
                    restore: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                });
            }, 50);
        });
    } catch (e) {
        console.error("Cropper Loader Error:", e);
        return Promise.reject(e);
    }
};

/**
 * Attaches the interceptor to an input.
 * @param {HTMLInputElement} input - The standard file input element
 * @param {Function} onChangeCallback - Optional function to manually run logic after mutation
 */
window.attachCropperToInput = function(input, onChangeCallback = null) {
    if (!input || input.__cropperAttached) return;
    input.__cropperAttached = true;

    input.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const rawFile = e.target.files[0];
            
            // Bypass non-images (PDFs)
            if (!rawFile.type.startsWith('image/')) {
                if (onChangeCallback) onChangeCallback(e);
                return;
            }

            try {
                // Trigger cropper overlay
                const croppedFile = await window.openCropper(rawFile, NaN); // NaN = Freeform
                
                // Inject the cropped file back into the original input using DataTransfer
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(croppedFile);
                e.target.files = dataTransfer.files;
                
                // Fire custom callback if needed
                if (onChangeCallback) {
                    onChangeCallback(e);
                } else {
                    // Trigger native DOM listener chain if bound outside
                    const event = new Event('change', { bubbles: true });
                    // Prevent circular loop
                    input.__cropperAttached = true;
                    // Note: Manually dispatching change might trigger this same listener!
                    // However, we wait for user output. If we dispatch change natively, we MUST guard it.
                }
            } catch (err) {
                console.log(err.message); // Usually cancellation
                input.value = ''; // Reset input to allow clicking same file again
            }
        }
    });
};

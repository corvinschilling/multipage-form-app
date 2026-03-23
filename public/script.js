document.addEventListener('DOMContentLoaded', () => {
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');
    const stepLines = document.querySelectorAll('.step-line');
    const form = document.getElementById('multiStepForm');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    let currentStep = 0;
    
    // Store Base64 photos
    let photoData = {
        photoAcces: null,
        photoConsignes: null,
        photoMateriaux: [] // Array for multiple photos
    };

    // Helper: Resize Image
    function resizeImage(file, maxWidth = 1200, maxHeight = 1200) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
        });
    }

    // Handle Single Photo Uploads (Site 2)
    ['photoAcces', 'photoConsignes'].forEach(id => {
        const input = document.getElementById(id);
        if(!input) return;
        const previewContainer = document.getElementById(`preview-container-${id.replace('photo', '').toLowerCase()}`);
        const previewImg = document.getElementById(`preview-img-${id.replace('photo', '').toLowerCase()}`);
        const removeBtn = document.querySelector(`.btn-remove-photo[data-target="${id}"]`);

        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64String = await resizeImage(file);
                    photoData[id] = base64String;
                    previewImg.src = base64String;
                    previewContainer.classList.remove('hidden');
                    
                    // Cleanup error if existed
                    const group = input.closest('.photo-upload');
                    if (group) group.classList.remove('error');
                } catch (error) {
                    console.error("Image processing error", error);
                }
            }
        });

        removeBtn.addEventListener('click', function() {
            input.value = '';
            photoData[id] = null;
            previewImg.src = '';
            previewContainer.classList.add('hidden');
        });
    });

    // Handle Multiple Photo Uploads (Site 3)
    const photoMateriaux = document.getElementById('photoMateriaux');
    const galleryMateriaux = document.getElementById('gallery-materiaux');
    
    if(photoMateriaux) {
        photoMateriaux.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            for(const file of files) {
                try {
                    const base64String = await resizeImage(file);
                    photoData.photoMateriaux.push(base64String);
                    
                    // Create preview element
                    const wrapper = document.createElement('div');
                    wrapper.className = 'photo-preview-container';
                    wrapper.style.display = 'inline-block';
                    
                    const img = document.createElement('img');
                    img.src = base64String;
                    img.className = 'photo-preview';
                    img.style.height = '100px';
                    img.style.width = 'auto';
                    
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn-remove-photo';
                    btn.innerHTML = '✖';
                    btn.onclick = () => {
                        galleryMateriaux.removeChild(wrapper);
                        photoData.photoMateriaux.splice(photoData.photoMateriaux.indexOf(base64String), 1);
                    };
                    
                    wrapper.appendChild(img);
                    wrapper.appendChild(btn);
                    galleryMateriaux.appendChild(wrapper);

                } catch(error) {
                    console.error(error);
                }
            }
            // Reset input so same file can be selected again
            photoMateriaux.value = '';
        });
    }

    // Handle Conditional logic
    const accesRadios = document.querySelectorAll('input[name="accesSecurite"]');
    const accesSubGroup = document.getElementById('accesSecuriteSubGroup');
    const accesSubRadios = document.querySelectorAll('input[name="accesSecuriteSub"]');
    
    accesRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'existant') {
                accesSubGroup.classList.remove('hidden');
                // Make sub-radios required manually via logic or attribute
                accesSubGroup.classList.add('is-required');
            } else {
                accesSubGroup.classList.add('hidden');
                accesSubGroup.classList.remove('is-required');
                accesSubRadios.forEach(r => r.checked = false); // clear selection
            }
        });
    });

    const consignesRadios = document.querySelectorAll('input[name="consignesVisibles"]');
    const consignesPhotoGroup = document.getElementById('consignesPhotoGroup');
    
    consignesRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Illisible/non visible') {
                consignesPhotoGroup.classList.remove('hidden');
                consignesPhotoGroup.classList.add('is-required');
            } else {
                consignesPhotoGroup.classList.add('hidden');
                consignesPhotoGroup.classList.remove('is-required');
                document.getElementById('photoConsignes').value = '';
                photoData.photoConsignes = null;
                document.getElementById('preview-container-consignes').classList.add('hidden');
            }
        });
    });

    // Remove error class on change for text/radios
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.input-group');
            if (group && group.classList.contains('error')) {
                group.classList.remove('error');
            }
        });
    });

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateFormSteps();
                updateProgressbar();
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            updateFormSteps();
            updateProgressbar();
        });
    });

    function validateStep(stepIndex) {
        const currentStepElement = formSteps[stepIndex];
        let isValid = true;

        // Check required text inputs (like nrChantier)
        const requiredInputs = currentStepElement.querySelectorAll('input[type="text"][required], select[required]');
        requiredInputs.forEach(input => {
            const group = input.closest('.input-group');
            if (!input.checkValidity()) {
                group.classList.add('error');
                isValid = false;
            } else {
                group.classList.remove('error');
            }
        });

        // Check radio groups
        const requiredRadioGroups = [...new Set(Array.from(currentStepElement.querySelectorAll('input[type="radio"][required]')).map(r => r.name))];
        requiredRadioGroups.forEach(name => {
            const isChecked = currentStepElement.querySelector(`input[name="${name}"]:checked`) !== null;
            const group = currentStepElement.querySelector(`input[name="${name}"]`).closest('.input-group');
            if (!isChecked) {
                group.classList.add('error');
                isValid = false;
            } else {
                group.classList.remove('error');
            }
        });

        // Check Custom required sub-groups
        const requiredSubGroups = currentStepElement.querySelectorAll('.is-required');
        requiredSubGroups.forEach(group => {
            if(group.id === 'accesSecuriteSubGroup') {
                const isChecked = currentStepElement.querySelector(`input[name="accesSecuriteSub"]:checked`) !== null;
                const radioGroup = group.querySelector('.radio-options');
                if(!isChecked) {
                    radioGroup.classList.add('error');
                    isValid = false;
                } else {
                    radioGroup.classList.remove('error');
                }
            } else if(group.id === 'consignesPhotoGroup') {
                if(!photoData.photoConsignes) {
                    group.classList.add('error');
                    isValid = false;
                } else {
                    group.classList.remove('error');
                }
            }
        });

        // Check Always required photos
        if(stepIndex === 1) { // Site 2
            const accesPhotoGroup = document.getElementById('photoAcces').closest('.photo-upload');
            if (!photoData.photoAcces) {
                accesPhotoGroup.classList.add('error');
                isValid = false;
            } else {
                accesPhotoGroup.classList.remove('error');
            }
        }

        return isValid;
    }

    function updateFormSteps() {
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
    }

    function updateProgressbar() {
        stepIndicators.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.add('active');
            } else if (index === currentStep) {
                step.classList.remove('completed');
                step.classList.add('active');
            } else {
                step.classList.remove('completed');
                step.classList.remove('active');
            }
        });

        stepLines.forEach((line, index) => {
            if (index < currentStep) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Final validation
        if (!validateStep(currentStep)) return;

        // UI Feedback
        submitBtn.disabled = true;
        const orgText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner"></span> Sende...';
        messageBox.classList.add('hidden');
        messageBox.className = 'message-box hidden';

        // Collect data
        const formData = new FormData(form);
        const data = {
            nrChantier: formData.get('nrChantier'),
            accesSecurite: formData.get('accesSecurite'),
            accesSecuriteSub: formData.get('accesSecuriteSub'),
            consignesVisibles: formData.get('consignesVisibles'),
            photos: photoData
        };

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message || 'Erfolgreich gesendet!', 'success');
                // Optional: full reload or form reset
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showMessage(result.message || 'Fehler beim Senden: ' + (result.message || ''), 'error');
            }
        } catch (error) {
            showMessage('Netzwerkfehler. Konnte Server nicht erreichen.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = orgText;
        }
    });

    function showMessage(msg, type) {
        messageBox.textContent = msg;
        messageBox.className = `message-box ${type}`;
        
        if(type === 'success') {
            document.querySelectorAll('.input-group.error').forEach(g => g.classList.remove('error'));
        }
    }
});

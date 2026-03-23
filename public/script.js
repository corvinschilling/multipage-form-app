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
    let photos = [null, null, null]; 

    // Handle Photo Uploads
    for (let i = 1; i <= 3; i++) {
        const photoInput = document.getElementById(`photo${i}`);
        const previewContainer = document.getElementById(`preview-container-${i}`);
        const previewImg = document.getElementById(`preview-img-${i}`);
        const removeBtn = document.querySelector(`.btn-remove-photo[data-step="${i}"]`);

        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64String = event.target.result;
                    photos[i-1] = base64String;
                    previewImg.src = base64String;
                    previewContainer.classList.remove('hidden');
                };
                // Resize or direct read. A direct read is fine for now
                reader.readAsDataURL(file);
            }
        });

        removeBtn.addEventListener('click', function() {
            photoInput.value = '';
            photos[i-1] = null;
            previewImg.src = '';
            previewContainer.classList.add('hidden');
        });
    }

    // Remove error class on change
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const group = radio.closest('.input-group');
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
        const requiredRadios = Array.from(currentStepElement.querySelectorAll('input[type="radio"][required]'));
        
        let isValid = true;

        if (requiredRadios.length > 0) {
            // Group by name
            const names = [...new Set(requiredRadios.map(r => r.name))];
            names.forEach(name => {
                const group = currentStepElement.querySelector(`input[name="${name}"]`).closest('.input-group');
                const isChecked = currentStepElement.querySelector(`input[name="${name}"]:checked`) !== null;
                
                if (!isChecked) {
                    group.classList.add('error');
                    isValid = false;
                } else {
                    group.classList.remove('error');
                }
            });
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
            question1: formData.get('question1'),
            question2: formData.get('question2'),
            question3: formData.get('question3'),
            screenshots: photos // pass photos array to the backend exactly as before expected
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
                form.reset();
                // reset photos
                photos = [null, null, null];
                for(let i=1; i<=3; i++){
                    document.getElementById(`preview-container-${i}`).classList.add('hidden');
                    document.getElementById(`preview-img-${i}`).src = '';
                }
                currentStep = 0;
                updateFormSteps();
                updateProgressbar();
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
            // Remove error styles just in case
            document.querySelectorAll('.input-group.error').forEach(g => g.classList.remove('error'));
            
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 5000);
        }
    }
});

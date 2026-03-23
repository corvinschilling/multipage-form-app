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
    let screenshot1 = null;
    let screenshot2 = null;
    let screenshot3 = null;

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
        btn.addEventListener('click', async () => {
            if (validateStep(currentStep)) {
                
                // Show loading during capture
                const orgText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span>...';

                try {
                    const canvas = await html2canvas(document.body);
                    const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for smaller payload
                    if (currentStep === 0) screenshot1 = imgData;
                    else if (currentStep === 1) screenshot2 = imgData;
                } catch (e) {
                    console.error('Screenshot error:', e);
                }

                btn.innerHTML = orgText;
                btn.disabled = false;

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

        // Capture screenshot 3
        try {
            const canvas = await html2canvas(document.body);
            screenshot3 = canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error('Screenshot error:', error);
        }

        // Collect data
        const formData = new FormData(form);
        const data = {
            question1: formData.get('question1'),
            question2: formData.get('question2'),
            question3: formData.get('question3'),
            screenshots: [screenshot1, screenshot2, screenshot3]
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

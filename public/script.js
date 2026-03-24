document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const langFrBtn = document.getElementById('btn-lang-fr');
    const langDeBtn = document.getElementById('btn-lang-de');
    const langSelection = document.getElementById('language-selection');
    const formContent = document.getElementById('form-content');

    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');
    const stepLines = document.querySelectorAll('.step-line');
    const form = document.getElementById('multiStepForm');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    let currentStep = 0;
    
    // Strict numeric formatting for nrChantier
    const nrChantierInput = document.getElementById('nrChantier');
    if (nrChantierInput) {
        nrChantierInput.addEventListener('input', function() {
            // Strip out any non-numeric characters in real-time
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    let photoData = {
        photoAcces: null,
        photoConsignes: null,
        photoMateriaux: [],
        photoStockage: null,
        photoDefaut: null,
        photoDomaine: [],
        photoDechets: null,
        photoRemarques: []
    };

    const langInput = document.getElementById('form-lang');
    const lang = langInput ? langInput.value : 'fr';

    const texts = {
        fr: {
            sending: '<span class="spinner"></span> Envoi...',
            success: 'Envoyé avec succès !',
            errorSend: 'Erreur lors de l\'envoi : ',
            errorNet: 'Erreur réseau. Serveur injoignable.'
        },
        de: {
            sending: '<span class="spinner"></span> Senden...',
            success: 'Erfolgreich gesendet!',
            errorSend: 'Fehler beim Senden : ',
            errorNet: 'Netzwerkfehler. Server nicht erreichbar.'
        }
    };
    const t = texts[lang];

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

    // Handle Single Photo Uploads
    ['photoAcces', 'photoConsignes', 'photoStockage', 'photoDefaut', 'photoDechets'].forEach(id => {
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

    // Handle Multiple Photo Uploads
    const photoMateriaux = document.getElementById('photoMateriaux');
    const galleryMateriaux = document.getElementById('gallery-materiaux');
    
    if(photoMateriaux) {
        photoMateriaux.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            for(const file of files) {
                try {
                    const base64String = await resizeImage(file);
                    photoData.photoMateriaux.push(base64String);
                    
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
                        
                        if(photoData.photoMateriaux.length === 0) {
                            photoMateriaux.closest('.photo-upload').classList.add('error');
                        }
                    };
                    
                    wrapper.appendChild(img);
                    wrapper.appendChild(btn);
                    galleryMateriaux.appendChild(wrapper);
                    
                    photoMateriaux.closest('.photo-upload').classList.remove('error');

                } catch(error) {
                    console.error(error);
                }
            }
            photoMateriaux.value = '';
        });
    }

    const photoDomaineInput = document.getElementById('photoDomaine');
    const galleryDomaine = document.getElementById('gallery-domaine');
    
    if(photoDomaineInput) {
        photoDomaineInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            for(const file of files) {
                try {
                    const base64String = await resizeImage(file);
                    photoData.photoDomaine.push(base64String);
                    
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
                        galleryDomaine.removeChild(wrapper);
                        photoData.photoDomaine.splice(photoData.photoDomaine.indexOf(base64String), 1);
                        
                        if(photoData.photoDomaine.length === 0) {
                            photoDomaineInput.closest('.photo-upload').classList.add('error');
                        }
                    };
                    
                    wrapper.appendChild(img);
                    wrapper.appendChild(btn);
                    galleryDomaine.appendChild(wrapper);
                    
                    photoDomaineInput.closest('.photo-upload').classList.remove('error');
                } catch(error) {
                    console.error(error);
                }
            }
            photoDomaineInput.value = '';
        });
    }

    const photoRemarques = document.getElementById('photoRemarques');
    const galleryRemarques = document.getElementById('gallery-remarques');
    
    if(photoRemarques) {
        photoRemarques.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            for(const file of files) {
                try {
                    const base64String = await resizeImage(file);
                    photoData.photoRemarques.push(base64String);
                    
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
                        galleryRemarques.removeChild(wrapper);
                        photoData.photoRemarques.splice(photoData.photoRemarques.indexOf(base64String), 1);
                    };
                    
                    wrapper.appendChild(img);
                    wrapper.appendChild(btn);
                    galleryRemarques.appendChild(wrapper);

                } catch(error) {
                    console.error(error);
                }
            }
            photoRemarques.value = '';
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
                accesSubGroup.classList.add('is-required');
            } else {
                accesSubGroup.classList.add('hidden');
                accesSubGroup.classList.remove('is-required');
                accesSubRadios.forEach(r => r.checked = false);
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
                if(document.getElementById('preview-container-consignes')) {
                    document.getElementById('preview-container-consignes').classList.add('hidden');
                }
            }
        });
    });

    const substancesRadios = document.querySelectorAll('input[name="substancesDangereuses"]');
    const substancesSubGroup = document.getElementById('substancesSubGroup');
    const substancesSubCheckboxes = document.querySelectorAll('input[name="substancesSub"]');
    const stockagePhotoGroup = document.getElementById('stockagePhotoGroup');
    const chkStockageCorrect = document.getElementById('chk-stockage-correct');

    substancesRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'oui') {
                substancesSubGroup.classList.remove('hidden');
                substancesSubGroup.classList.add('is-required');
            } else {
                substancesSubGroup.classList.add('hidden');
                substancesSubGroup.classList.remove('is-required');
                substancesSubCheckboxes.forEach(c => c.checked = false);
                stockagePhotoGroup.classList.add('hidden');
                stockagePhotoGroup.classList.remove('is-required');
                document.getElementById('photoStockage').value = '';
                photoData.photoStockage = null;
                if(document.getElementById('preview-container-stockage')) {
                    document.getElementById('preview-container-stockage').classList.add('hidden');
                }
            }
        });
    });

    if (chkStockageCorrect) {
        chkStockageCorrect.addEventListener('change', () => {
            if (chkStockageCorrect.checked) {
                stockagePhotoGroup.classList.remove('hidden');
                stockagePhotoGroup.classList.add('is-required');
            } else {
                stockagePhotoGroup.classList.add('hidden');
                stockagePhotoGroup.classList.remove('is-required');
                document.getElementById('photoStockage').value = '';
                photoData.photoStockage = null;
                if(document.getElementById('preview-container-stockage')) {
                    document.getElementById('preview-container-stockage').classList.add('hidden');
                }
            }
        });
    }

    const aideLevageRadios = document.querySelectorAll('input[name="aideLevage"]');
    const aideLevageSubGroup = document.getElementById('aideLevageSubGroup');
    const aideLevageSubCheckboxes = document.querySelectorAll('input[name="aideLevageSub"]');
    const defautPhotoGroup = document.getElementById('defautPhotoGroup');
    const chkDefaut = document.getElementById('chk-defaut');

    aideLevageRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'oui') {
                aideLevageSubGroup.classList.remove('hidden');
                aideLevageSubGroup.classList.add('is-required');
            } else {
                aideLevageSubGroup.classList.add('hidden');
                aideLevageSubGroup.classList.remove('is-required');
                aideLevageSubCheckboxes.forEach(c => c.checked = false);
                defautPhotoGroup.classList.add('hidden');
                defautPhotoGroup.classList.remove('is-required');
                document.getElementById('photoDefaut').value = '';
                photoData.photoDefaut = null;
                if(document.getElementById('preview-container-defaut')) {
                    document.getElementById('preview-container-defaut').classList.add('hidden');
                }
            }
        });
    });

    if (chkDefaut) {
        chkDefaut.addEventListener('change', () => {
            if (chkDefaut.checked) {
                defautPhotoGroup.classList.remove('hidden');
                defautPhotoGroup.classList.add('is-required');
            } else {
                defautPhotoGroup.classList.add('hidden');
                defautPhotoGroup.classList.remove('is-required');
                document.getElementById('photoDefaut').value = '';
                photoData.photoDefaut = null;
                if(document.getElementById('preview-container-defaut')) {
                    document.getElementById('preview-container-defaut').classList.add('hidden');
                }
            }
        });
    }

    // --- Steps 7 & 8 Conditional Logic ---

    const dechetsRadios = document.querySelectorAll('input[name="dechetsChantier"]');
    const dechetsPhotoGroup = document.getElementById('dechetsPhotoGroup');
    
    dechetsRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'non') {
                dechetsPhotoGroup.classList.remove('hidden');
                dechetsPhotoGroup.classList.add('is-required');
            } else {
                dechetsPhotoGroup.classList.add('hidden');
                dechetsPhotoGroup.classList.remove('is-required');
                document.getElementById('photoDechets').value = '';
                photoData.photoDechets = null;
                if(document.getElementById('preview-container-dechets')) {
                    document.getElementById('preview-container-dechets').classList.add('hidden');
                }
            }
        });
    });

    const materielRadios = document.querySelectorAll('input[name="materielSecours"]');
    const materielSubGroup = document.getElementById('materielSecoursSubGroup');
    const materielSubCheckboxes = document.querySelectorAll('input[name="materielSecoursSub"]');
    
    materielRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'non') {
                materielSubGroup.classList.remove('hidden');
                materielSubGroup.classList.add('is-required');
            } else {
                materielSubGroup.classList.add('hidden');
                materielSubGroup.classList.remove('is-required');
                materielSubCheckboxes.forEach(c => c.checked = false);
            }
        });
    });

    const echafaudagesRadios = document.querySelectorAll('input[name="echafaudages"]');
    const echafaudagesSubGroup = document.getElementById('echafaudagesSubGroup');
    const echafaudagesSubCheckboxes = document.querySelectorAll('input[name="echafaudagesSub"]');
    const modificationsSubGroup = document.getElementById('modificationsSubGroup');
    const modificationsSubCheckboxes = document.querySelectorAll('input[name="modificationsSub"]');

    echafaudagesRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'oui') {
                echafaudagesSubGroup.classList.remove('hidden');
                echafaudagesSubGroup.classList.add('is-required');
                
                modificationsSubGroup.classList.add('hidden');
                modificationsSubGroup.classList.remove('is-required');
                modificationsSubCheckboxes.forEach(c => c.checked = false);
            } else if (radio.value === 'Modifications apportées') {
                modificationsSubGroup.classList.remove('hidden');
                modificationsSubGroup.classList.add('is-required');
                
                echafaudagesSubGroup.classList.add('hidden');
                echafaudagesSubGroup.classList.remove('is-required');
                echafaudagesSubCheckboxes.forEach(c => c.checked = false);
            } else {
                echafaudagesSubGroup.classList.add('hidden');
                echafaudagesSubGroup.classList.remove('is-required');
                echafaudagesSubCheckboxes.forEach(c => c.checked = false);
                
                modificationsSubGroup.classList.add('hidden');
                modificationsSubGroup.classList.remove('is-required');
                modificationsSubCheckboxes.forEach(c => c.checked = false);
            }
        });
    });

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.input-group');
            if (group && group.classList.contains('error')) {
                group.classList.remove('error');
            }
            if (messageBox && !messageBox.classList.contains('hidden')) {
                messageBox.classList.add('hidden');
            }
        });
    });

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (messageBox && !messageBox.classList.contains('hidden')) {
                messageBox.classList.add('hidden');
            }
            if (validateStep(currentStep)) {
                currentStep++;
                updateFormSteps();
                updateProgressbar();
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (messageBox && !messageBox.classList.contains('hidden')) {
                messageBox.classList.add('hidden');
            }
            currentStep--;
            updateFormSteps();
            updateProgressbar();
        });
    });

    function validateStep(stepIndex) {
        const currentStepElement = formSteps[stepIndex];
        let isValid = true;

        // Custom validation for nrChantier (exactly 9 digits)
        const nrChantierInput = currentStepElement.querySelector('#nrChantier');
        if (nrChantierInput) {
            const rawVal = nrChantierInput.value.replace(/\D/g, ''); 
            if (rawVal.length !== 9) {
                nrChantierInput.closest('.input-group').classList.add('error');
                isValid = false;
            } else {
                nrChantierInput.closest('.input-group').classList.remove('error');
                nrChantierInput.value = rawVal; 
            }
        }

        // Check required text inputs
        const requiredInputs = currentStepElement.querySelectorAll('input[type="text"][required]:not(#nrChantier), select[required]');
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
        const requiredRadioGroupsItems = currentStepElement.querySelectorAll('input[type="radio"][required]');
        if(requiredRadioGroupsItems.length > 0) {
            const requiredRadioGroups = [...new Set(Array.from(requiredRadioGroupsItems).map(r => r.name))];
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
        }

        // Always required Checkbox Groups (like Machines et Outils)
        const requiredCheckboxGroups = currentStepElement.querySelectorAll('.is-required-checkbox');
        requiredCheckboxGroups.forEach(group => {
            const isChecked = group.querySelectorAll('input[type="checkbox"]:checked').length > 0;
            if(!isChecked) {
                group.classList.add('error');
                isValid = false;
            } else {
                group.classList.remove('error');
            }
        });

        // Check Custom required sub-groups (only if parent is visible)
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
            } else if(group.id === 'substancesSubGroup' || group.id === 'materielSecoursSubGroup' || group.id === 'echafaudagesSubGroup' || group.id === 'modificationsSubGroup' || group.classList.contains('is-checkbox-group')) {
                // If it's a checkbox conditionally required group
                const checkboxes = group.querySelectorAll('input[type="checkbox"]');
                const isChecked = Array.from(checkboxes).some(c => c.checked);
                const cbGroup = group.querySelector('.checkbox-options');
                if(!isChecked) {
                    if(cbGroup) cbGroup.classList.add('error');
                    isValid = false;
                } else {
                    if(cbGroup) cbGroup.classList.remove('error');
                }
            } else if(group.id === 'stockagePhotoGroup' || group.id === 'defautPhotoGroup' || group.id === 'dechetsPhotoGroup') {
                let photoKey;
                if(group.id === 'stockagePhotoGroup') photoKey = photoData.photoStockage;
                else if(group.id === 'defautPhotoGroup') photoKey = photoData.photoDefaut;
                else if(group.id === 'dechetsPhotoGroup') photoKey = photoData.photoDechets;

                if(!photoKey) {
                    group.classList.add('error');
                    isValid = false;
                } else {
                    group.classList.remove('error');
                }
            }
        });

        // Check Always required photos
        if(stepIndex === 1) { // Step 2 - Acces photo
            const accesPhotoGroup = document.getElementById('photoAcces');
            if(accesPhotoGroup) {
                const groupParent = accesPhotoGroup.closest('.photo-upload');
                if (!photoData.photoAcces) {
                    groupParent.classList.add('error');
                    isValid = false;
                } else {
                    groupParent.classList.remove('error');
                }
            }
        } else if(stepIndex === 2) { // Step 3 - Materiaux photo
            const materielPhotoGroup = document.getElementById('photoMateriaux');
            if(materielPhotoGroup) {
                const groupParent = materielPhotoGroup.closest('.photo-upload');
                if (photoData.photoMateriaux.length === 0) {
                    groupParent.classList.add('error');
                    isValid = false;
                } else {
                    groupParent.classList.remove('error');
                }
            }
        } else if(stepIndex === 6) { // Step 7 - Domaine photo
            const domainePhotoGroup = document.getElementById('photoDomaine');
            if(domainePhotoGroup) {
                const groupParent = domainePhotoGroup.closest('.photo-upload');
                if (photoData.photoDomaine.length === 0) {
                    groupParent.classList.add('error');
                    isValid = false;
                } else {
                    groupParent.classList.remove('error');
                }
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

        if (!validateStep(currentStep)) return;

        submitBtn.disabled = true;
        const orgText = submitBtn.innerHTML;
        submitBtn.innerHTML = t.sending;
        messageBox.classList.add('hidden');
        messageBox.className = 'message-box hidden';

        const formData = new FormData(form);
        
        // Ensure checkboxes are grouped correctly as arrays
        const machinesOutils = formData.getAll('machinesOutils');
        const substancesSub = formData.getAll('substancesSub');
        const aideLevageSub = formData.getAll('aideLevageSub');
        const materielSecoursSub = formData.getAll('materielSecoursSub');
        const echafaudagesSub = formData.getAll('echafaudagesSub');
        const modificationsSub = formData.getAll('modificationsSub');

        const data = {
            lang: lang,
            nrChantier: formData.get('nrChantier'),
            accesSecurite: formData.get('accesSecurite'),
            accesSecuriteSub: formData.get('accesSecuriteSub'),
            consignesVisibles: formData.get('consignesVisibles'),
            substancesDangereuses: formData.get('substancesDangereuses'),
            substancesSub: substancesSub,
            machinesOutils: machinesOutils,
            epi: formData.get('epi'),
            aideLevage: formData.get('aideLevage'),
            aideLevageSub: aideLevageSub,
            installationsSanitaires: formData.get('installationsSanitaires'),
            materielSecours: formData.get('materielSecours'),
            materielSecoursSub: materielSecoursSub,
            dechetsChantier: formData.get('dechetsChantier'),
            echafaudages: formData.get('echafaudages'),
            echafaudagesSub: echafaudagesSub,
            modificationsSub: modificationsSub,
            autresRemarques: formData.get('autresRemarques'),
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
                showMessage(t.success, 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showMessage(t.errorSend + (result.message || ''), 'error');
            }
        } catch (error) {
            showMessage(t.errorNet, 'error');
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

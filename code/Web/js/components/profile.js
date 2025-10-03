// Profile Component - User profile information
class ProfileComponent {
    constructor() {
        this.container = document.getElementById('profile-component');
        this.profileData = {
            name: 'Lê Quang Huy',
            studentId: 'B22DCCN382',
            gitLink: 'https://github.com/Y0KUNA/IoT-BTL',
            reportLink: '',
            image: 'assets/images/image.png'
        };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="profile-container">
                <div class="profile-card">
                    ${this.renderProfileImage()}
                    ${this.renderProfileInfo()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderProfileImage() {
        return `
            <div class="profile-image-container">
                <img src="${this.profileData.image}" alt="Profile Image" class="profile-image" id="profile-image">
            </div>
        `;
    }

    renderProfileInfo() {
        return `
            <div class="profile-info">
                <div class="profile-row">
                    <span class="profile-label">Họ tên:</span>
                    <span class="profile-value">${this.profileData.name}</span>
                </div>
                
                <div class="profile-row">
                    <span class="profile-label">Mã sinh viên:</span>
                    <span class="profile-value">${this.profileData.studentId}</span>
                </div>
                
                <div class="profile-row">
                    <span class="profile-label">Link git:</span>
                    <a href="${this.profileData.gitLink}" target="_blank" class="profile-value link">
                        ${this.profileData.gitLink}
                    </a>
                </div>
                
                <div class="profile-row">
                    <span class="profile-label">Link báo cáo PDF:</span>
                    <span class="profile-value ${this.profileData.reportLink ? 'link' : ''}">
                        ${this.profileData.reportLink || 'Chưa có báo cáo'}
                    </span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add click handler for image upload
        const profileImage = this.container.querySelector('#profile-image');
        if (profileImage) {
            profileImage.addEventListener('click', () => {
                this.handleImageUpload();
            });
            
            // Add hover effect
            profileImage.style.cursor = 'pointer';
            profileImage.title = 'Click to change profile image';
        }

        // Add handlers for editable fields
        this.makeFieldsEditable();
    }

    handleImageUpload() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.profileData.image = e.target.result;
                    this.updateProfileImage();
                    this.saveProfileData();
                };
                reader.readAsDataURL(file);
            }
        });

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    updateProfileImage() {
        const profileImage = this.container.querySelector('#profile-image');
        if (profileImage) {
            profileImage.src = this.profileData.image;
        }
    }

    makeFieldsEditable() {
        const editableFields = [
            { key: 'name', label: 'Họ tên:' },
            { key: 'studentId', label: 'Mã sinh viên:' },
            { key: 'gitLink', label: 'Link git:' },
            { key: 'reportLink', label: 'Link báo cáo PDF:' }
        ];

        editableFields.forEach(field => {
            const valueElement = this.getValueElementByLabel(field.label);
            if (valueElement && field.key !== 'gitLink') {
                this.makeElementEditable(valueElement, field.key);
            }
        });
    }

    getValueElementByLabel(label) {
        const rows = this.container.querySelectorAll('.profile-row');
        for (let row of rows) {
            const labelElement = row.querySelector('.profile-label');
            if (labelElement && labelElement.textContent === label) {
                return row.querySelector('.profile-value:not(.link)') || row.querySelector('.profile-value');
            }
        }
        return null;
    }

    makeElementEditable(element, key) {
        element.style.cursor = 'pointer';
        element.title = 'Click to edit';
        
        element.addEventListener('click', () => {
            this.startEditing(element, key);
        });
    }

    startEditing(element, key) {
        const currentValue = this.profileData[key];
        const isLink = key === 'gitLink' || key === 'reportLink';
        
        // Create input element
        const input = document.createElement('input');
        input.type = isLink ? 'url' : 'text';
        input.value = currentValue;
        input.className = 'profile-edit-input';
        input.style.cssText = `
            background: #FFF;
            border: 1px solid #6366F1;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 16px;
            font-family: inherit;
            color: ${isLink ? '#007BFF' : '#6C757D'};
            width: 100%;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        `;

        // Replace element with input
        element.style.display = 'none';
        element.parentNode.insertBefore(input, element.nextSibling);
        input.focus();
        input.select();

        // Handle save/cancel
        const saveEdit = () => {
            const newValue = input.value.trim();
            if (newValue !== currentValue) {
                this.profileData[key] = newValue;
                this.saveProfileData();
            }
            
            // Update display
            if (isLink && newValue) {
                element.innerHTML = `<a href="${newValue}" target="_blank" class="profile-value link">${newValue}</a>`;
            } else {
                element.textContent = newValue || (key === 'reportLink' ? 'Chưa có báo cáo' : '');
            }
            
            // Restore original element
            element.style.display = '';
            input.remove();
        };

        const cancelEdit = () => {
            element.style.display = '';
            input.remove();
        };

        // Event listeners for save/cancel
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }

    saveProfileData() {
        StorageUtils.setItem('profileData', this.profileData);
    }

    loadProfileData() {
        const savedData = StorageUtils.getItem('profileData');
        if (savedData) {
            this.profileData = { ...this.profileData, ...savedData };
        }
    }

    // Method to export profile data
    exportProfile() {
        const profileInfo = {
            name: this.profileData.name,
            studentId: this.profileData.studentId,
            gitLink: this.profileData.gitLink,
            reportLink: this.profileData.reportLink,
            exportDate: DateUtils.formatDateTime(new Date())
        };

        const dataStr = JSON.stringify(profileInfo, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `profile_${this.profileData.studentId}_${DateUtils.formatDate(new Date())}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Method to import profile data
    importProfile() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        
                        // Validate imported data
                        if (this.validateProfileData(importedData)) {
                            this.profileData = { ...this.profileData, ...importedData };
                            this.saveProfileData();
                            this.render();
                            
                            // Show success message
                            this.showMessage('Profile imported successfully!', 'success');
                        } else {
                            this.showMessage('Invalid profile data format!', 'error');
                        }
                    } catch (error) {
                        this.showMessage('Error reading profile file!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    validateProfileData(data) {
        const requiredFields = ['name', 'studentId'];
        return requiredFields.every(field => 
            data.hasOwnProperty(field) && typeof data[field] === 'string'
        );
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `profile-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#6366F1'};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        document.body.appendChild(messageEl);

        // Animate in
        AnimationUtils.fadeIn(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            AnimationUtils.fadeOut(messageEl);
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    // Initialize component with saved data
    init() {
        this.loadProfileData();
        this.render();
    }

    // Public methods
    getProfileData() {
        return { ...this.profileData };
    }

    updateProfile(updates) {
        this.profileData = { ...this.profileData, ...updates };
        this.saveProfileData();
        this.render();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ProfileComponent = ProfileComponent;
}

// Login Component
class LoginComponent {
    constructor(onLoginSuccess) {
        // onLoginSuccess: callback khi login xong
        this.container = document.getElementById('login-component');
        this.onLoginSuccess = onLoginSuccess;
        this.render();
    }

    render() {
        if (!this.container) return;
        console.log('Rendering LoginComponent');
        this.container.innerHTML = `
            <div class="card" style="max-width:400px; margin:0 auto;">
                <h2 class="card-title text-center">Đăng nhập</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="username" class="form-label">Tên đăng nhập</label>
                        <input 
                            type="text" 
                            id="username" 
                            class="form-input" 
                            placeholder="Nhập username" 
                            required 
                        />
                    </div>
                    <div class="form-group">
                        <label for="password" class="form-label">Mật khẩu</label>
                        <input 
                            type="password" 
                            id="password" 
                            class="form-input" 
                            placeholder="Nhập password" 
                            required 
                        />
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Đăng nhập</button>
                </form>
                <div id="login-message" class="text-center mb-16" style="margin-top:8px;"></div>
            </div>
        `;
        this.attachEvents();
    }

    attachEvents() {
        const form = this.container.querySelector('#login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = this.container.querySelector('#username').value;
            const password = this.container.querySelector('#password').value;
            await this.handleLogin(username, password);
        });
    }

    async handleLogin(username, password) {
        const msgEl = this.container.querySelector('#login-message');
        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const error = await res.json();
                msgEl.className = 'text-center text-danger';
                msgEl.textContent = error.message || 'Đăng nhập thất bại';
                return;
            }

            const data = await res.json();
            // lưu token
            localStorage.setItem('token', data.token);
            msgEl.className = 'text-center text-success';
            msgEl.textContent = 'Đăng nhập thành công!';

            // callback chuyển sang Home
            if (typeof this.onLoginSuccess === 'function') {
                this.onLoginSuccess();
            }
        } catch (err) {
            console.error('Lỗi đăng nhập:', err);
            msgEl.className = 'text-center text-danger';
            msgEl.textContent = 'Có lỗi xảy ra';
        }
    }
}

if (typeof window !== 'undefined') {
    window.LoginComponent = LoginComponent;
}

import { Controller, Post, Body, Get, UseGuards, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { UserRole } from './enums/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: any) {
    return {
      message: 'Profile retrieved successfully',
      user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/dashboard')
  async adminDashboard(@GetUser() user: any) {
    return {
      message: 'Welcome to admin dashboard',
      user,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Get('reset-password')
  async showResetPasswordForm(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reset Password - Error</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">❌ Token Invalid</h2>
              <p>Token reset password tidak ditemukan atau tidak valid.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Validasi token terlebih dahulu
    const isValidToken = await this.authService.validateResetToken(token);
    
    if (!isValidToken.valid) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reset Password - Error</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">❌ Token Expired</h2>
              <p>${isValidToken.message}</p>
              <p>Silakan request reset password baru.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Tampilkan form reset password
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reset Password - HijauIn</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 15px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 450px;
              width: 100%;
            }
            .logo {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo h1 {
              color: #2ecc71;
              font-size: 32px;
              margin-bottom: 10px;
            }
            .logo p {
              color: #7f8c8d;
              font-size: 14px;
            }
            h2 {
              color: #2c3e50;
              margin-bottom: 10px;
              font-size: 24px;
            }
            .subtitle {
              color: #7f8c8d;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .form-group {
              margin-bottom: 20px;
            }
            label {
              display: block;
              margin-bottom: 8px;
              color: #2c3e50;
              font-weight: 500;
              font-size: 14px;
            }
            input {
              width: 100%;
              padding: 12px 15px;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              font-size: 14px;
              transition: all 0.3s;
            }
            input:focus {
              outline: none;
              border-color: #2ecc71;
            }
            .password-requirements {
              font-size: 12px;
              color: #7f8c8d;
              margin-top: 5px;
            }
            button {
              width: 100%;
              padding: 14px;
              background: #2ecc71;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
              margin-top: 10px;
            }
            button:hover {
              background: #27ae60;
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
            }
            button:disabled {
              background: #95a5a6;
              cursor: not-allowed;
              transform: none;
            }
            .message {
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-size: 14px;
              display: none;
            }
            .message.success {
              background: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .message.error {
              background: #f8d7da;
              color: #721c24;
              border: 1px solid #f5c6cb;
            }
            .loader {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #2ecc71;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              animation: spin 1s linear infinite;
              display: inline-block;
              margin-left: 10px;
            }
            .success-animation {
              text-align: center;
              padding: 30px;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              stroke-width: 3;
              stroke: #2ecc71;
              stroke-miterlimit: 10;
              margin: 10px auto;
              box-shadow: inset 0px 0px 0px #2ecc71;
              animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
            }
            .checkmark__circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-width: 3;
              stroke-miterlimit: 10;
              stroke: #2ecc71;
              fill: none;
              animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke {
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
            @keyframes fill {
              100% { box-shadow: inset 0px 0px 0px 30px #2ecc71; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .success-content {
              display: none;
            }
            .success-content h2 {
              color: #2ecc71;
              margin: 20px 0 15px;
            }
            .success-content p {
              color: #7f8c8d;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .success-content .instruction {
              background: #f0f9ff;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #2ecc71;
              margin: 20px 0;
              text-align: left;
            }
            .success-content .instruction strong {
              color: #2c3e50;
              display: block;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>🌱 HijauIn</h1>
              <p>Reset Your Password</p>
            </div>
            
            <div id="formContainer">
              <h2>Reset Password</h2>
              <p class="subtitle">Masukkan password baru Anda di bawah ini</p>
              
              <div id="message" class="message"></div>
              
              <form id="resetForm">
                <input type="hidden" id="token" value="${token}">
                
                <div class="form-group">
                  <label for="newPassword">Password Baru *</label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    name="newPassword"
                    placeholder="Masukkan password baru"
                    required
                    minlength="6"
                  >
                  <div class="password-requirements">Minimal 6 karakter</div>
                </div>
                
                <div class="form-group">
                  <label for="confirmPassword">Konfirmasi Password *</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    placeholder="Masukkan ulang password baru"
                    required
                    minlength="6"
                  >
                </div>
                
                <button type="submit" id="submitBtn">
                  Reset Password
                </button>
              </form>
            </div>

            <div id="successContainer" class="success-content">
              <div class="success-animation">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                  <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h2>✅ Password Berhasil Direset!</h2>
              <p>Password Anda telah berhasil diperbarui.</p>
              <div class="instruction">
                <strong>📱 Langkah Selanjutnya:</strong>
                <p>Silakan kembali ke aplikasi <strong>HijauIn</strong> dan gunakan password baru Anda untuk login.</p>
              </div>
              <p style="color: #95a5a6; font-size: 12px; margin-top: 20px;">
                Halaman ini akan tertutup otomatis dalam beberapa detik...
              </p>
            </div>
          </div>

          <script>
            const form = document.getElementById('resetForm');
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            const formContainer = document.getElementById('formContainer');
            const successContainer = document.getElementById('successContainer');
            
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const token = document.getElementById('token').value;
              const newPassword = document.getElementById('newPassword').value;
              const confirmPassword = document.getElementById('confirmPassword').value;
              
              // Validasi password match
              if (newPassword !== confirmPassword) {
                showMessage('Password dan konfirmasi password tidak cocok!', 'error');
                return;
              }
              
              // Validasi panjang password
              if (newPassword.length < 6) {
                showMessage('Password minimal 6 karakter!', 'error');
                return;
              }
              
              // Disable button dan tampilkan loading
              submitBtn.disabled = true;
              submitBtn.innerHTML = 'Processing... <span class="loader"></span>';
              
              try {
                const response = await fetch('/auth/reset-password', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    token: token,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                  })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  // Sembunyikan form dan tampilkan pesan sukses
                  formContainer.style.display = 'none';
                  successContainer.style.display = 'block';
                  
                  // Auto close window setelah 5 detik
                  setTimeout(() => {
                    window.close();
                    // Jika window.close() tidak bekerja (browser restriction)
                    // redirect ke halaman lain atau tampilkan pesan
                    setTimeout(() => {
                      window.location.href = '/';
                    }, 1000);
                  }, 5000);
                } else {
                  showMessage('❌ ' + (data.message || 'Terjadi kesalahan'), 'error');
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = 'Reset Password';
                }
              } catch (error) {
                showMessage('❌ Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Reset Password';
              }
            });
            
            function showMessage(text, type) {
              messageDiv.textContent = text;
              messageDiv.className = 'message ' + type;
              messageDiv.style.display = 'block';
              
              // Auto hide setelah 5 detik untuk error
              if (type === 'error') {
                setTimeout(() => {
                  messageDiv.style.display = 'none';
                }, 5000);
              }
            }
          </script>
        </body>
      </html>
    `);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}

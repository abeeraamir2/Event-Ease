const form = document.querySelector('#user-login-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    console.log("Email:", email);
    console.log("Password:", password);

    btnBackHome.addEventListener('click', () => {
        window.location.href = 'home.html';  // Navigate to home.html
    });

    try {
        const res = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("User login response:", data);

        if (res.ok) {
            // Store token
            localStorage.setItem('userToken', data.token);

            // Save user object for future use
            const userData = {
                id: data.user?._id || data.user?.id,
                name: data.user?.name,
                email: data.user?.email
            };

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('userId', userData.id);

            alert('Login successful!');
            window.location.href = 'home.html';
        } else {
            alert(data.message || 'Invalid email or password');
        }
    } catch (err) {
        console.error(err);
        alert('Server error: ' + err.message);
    }
});

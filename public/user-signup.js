const form = document.querySelector('#user-signup-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent page refresh

    // Get form values
    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;
    const contact = form.querySelector('input[name="contact"]').value.trim();
    const city = form.querySelector('input[name="city"]').value.trim();

    // ✅ Frontend validation
    if (!name || !email || !password || !confirmPassword || !contact || !city) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/user/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                password,
                confirmPassword,
                contact,
                city
            })
        });

        const data = await res.json();

        if (res.ok) {
            // Save JWT token
            localStorage.setItem('userToken', data.token);

            alert('Signup successful! You can now log in.');
            form.reset();
            window.location.href = 'user-login.html'; // redirect to login
        } else {
            alert(data.message); // backend error
        }
    } catch (err) {
        console.error(err);
        alert('Server error');
    }
});

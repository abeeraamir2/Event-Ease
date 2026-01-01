const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;
    const contact = form.querySelector('input[name="contact"]').value.trim();
    const location = form.querySelector('input[name="location"]').value.trim();
    const companyDescription = form.querySelector('textarea[name="companyDescription"]').value.trim();

    if (!name || !email || !password || !confirmPassword || !contact || !location || !companyDescription) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/vendor/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                email, 
                password, 
                confirmPassword, 
                contact,
                location,
                companyDescription
            }) 
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('vendorToken', data.token);

            alert('Signup successful! You can now login.');
            form.reset(); 
            window.location.href = 'vendor-login.html'; 
        } else {
            alert(data.message); 
        }
    } catch (err) {
        console.error(err);
        alert('Server error');
    }
});

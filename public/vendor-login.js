const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const btnBackHome = document.getElementById('btnBackHome');

    btnBackHome.addEventListener('click', () => {
        window.location.href = 'home.html';  
    });

    try {
        const res = await fetch('/api/vendor/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log('Login response:', data); 

        if (res.ok) {
            localStorage.setItem('vendorToken', data.token);
            
            const vendorData = {
                id: data.vendor._id || data.vendor.id,
                name: data.vendor.name,
                email: data.vendor.email
            };
            
            localStorage.setItem('vendor', JSON.stringify(vendorData));
            
            console.log('Vendor saved:', vendorData); 
            
            alert('Login successful!');
            window.location.href = 'vendor-dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Server error: ' + err.message);
    }
});
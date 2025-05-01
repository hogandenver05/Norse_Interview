document.getElementById('signupForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get the values from the form
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;

    if (!email.endsWith('@nku.edu')) {
        alert('Please use an NKU email');
        return;
    }

    try {
        // Send a POST request to the server
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            headers: 
                {
                    'Content-Type': 'application/json',
                },
            body: JSON.stringify(
                {
                    email: email,
                    password: password
                }
            )
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Signup successful:', data);

            // Redirect to the login page or show a success message
            alert('Signup successful! Please log in.');
            window.location.href = 'pages/login';
        } else {
            const errorText = await response.text();
            console.error('Signup failed:', errorText);
            alert('Signup failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

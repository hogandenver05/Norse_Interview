document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get the email and password values from the form
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;

    try {
        // Send a POST request to the server
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: 
                {
                    'Content-Type': 'application/json',
                },
            body: JSON.stringify(
                {
                    email: email,
                    password: password,
                }
            )
        });

        if (response.ok) {
            const data = await response.json();
            // console.log('Login successful:', data);

            // Save the token to localStorage or handle it as needed
            localStorage.setItem('token', data.token);
            console.log('Token saved:', data.token);

            // Redirect to a protected page or show a success message
            // alert('Login successful!');
            window.location.href = 'dashboard';
        } else {
            // TODO: Handle login failure with the form (make it fancy)
            const errorText = await response.text();
            console.error('Login failed:', errorText);
            alert('Login failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

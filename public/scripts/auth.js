(function () {
    const publicPages = ['/', 'login']; // Pages that don't require authentication
    const currentPage = window.location.pathname.split('/').pop();

    // Check if the page is public
    if (!publicPages.includes(currentPage)) {
        const token = localStorage.getItem('token');

        if (!token) {
            // Redirect to login if token is missing
            window.location.href = 'login';
        } else {
            // Validate the token with the server
            fetch('http://localhost:3000/api/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    // If token is invalid, redirect to login
                    window.location.href = 'login';
                }
            })
            .catch(error => {
                console.error('Error validating token:', error);
                window.location.href = 'login';
            });
        }
    }
})();

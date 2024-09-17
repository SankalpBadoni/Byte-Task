function login(provider) {
    console.log(`Attempting to login with ${provider}`);
    const serverUrl = 'http://localhost:3000'; // Ensure this matches your server's address and port
    const authUrl = `${serverUrl}/auth/${provider}`;
    console.log(`Redirecting to: ${authUrl}`);
    window.location.href = authUrl;
}
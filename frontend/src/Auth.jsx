import React, { useState } from 'react';

function Auth({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const endpoint = isLogin
        ? 'http://localhost:4001/api/login'
        : 'http://localhost:4001/api/register';
    
    try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();

        if (data.success) {
          setMessage(data.message);

          if (isLogin && data.token) {
            sessionStorage.setItem('token', data.token);
            setToken(data.token);
            console.log('Token successfully saved to sessionStorage!');
          }
        } else {
          setMessage(data.message || 'Something went wrong.');
        }
    } catch (error) {
        console.error('Connection error:', error);
        setMessage('Failed to connect to the server. Is the backend running?');
    }
  };
  return (
    <div className="auth-container">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        {message && <p className="auth-message">{message}</p>}

        <form onSubmit={handleSubmit}>
            <div>
                <label>Username: </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password: </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                </div>
                <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>

        <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="switch-btn"

        >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
    </div>
  )
}

export default Auth;
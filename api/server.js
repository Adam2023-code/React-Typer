const express = require('express');
const app = express();

app.use(express.json());

// const verifyRole = (requiredRole = null) => {
//     return (req, res, next) => {
//         const authHeader = req.headers['authorization'];
//         const token = authHeader && authHeader.split(' ')[1];

//         if (!token) {
//             return res.status(401).json({ success: false, message: 'Access denied. No token provided.'});
//         }

//         try {
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
//             req.user = decoded;

//             if (requiredRole && req.user.role != requiredRole) {
//                 return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions.'})
//             }

//             next();
//         } catch (err) {
//             return res.status(403).json({ success: false, message: 'Invalid or expired token.'});
//         }
//     };
// };

app.post('/api/login', (req, res) => {
    const {username, password} = req.body;
    })

// app.get('/api/protected-route', verifyRole(), (req, res) => {
//     res.json({
//         success: true,
//         message: 'You have successfully accessed a protected route!',
//         user: req.user
//     });
// });
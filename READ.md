# Blogs API

A simple Express.js-based Blogs API with authentication, user profile management, blog categories, and post creation features. Built using Node.js, Express, and MySQL.

# Features

- User Registration & Login with JWT Authentication
- Create, Update, Delete and View Blog Posts
- Role-based Admin Access
- Blog Categories
- View and Update User Profiles
- Secure Routes with Middleware Authentication

# Technologies Used

- Node.js
- Express.js
- MySQL (via `mysql2`)
- JWT (JSON Web Tokens)
- Postman (for testing)
- Nodemon (for development)


# Project Structure

blogs-api/
├── config/
│ └── db.js
├── controllers/
│ ├── usersController.js
│ ├── blogsController.js
│ └── adminController.js
├── middleware/
  └── admin.js
│ └── auth.js
├── routes/
│ ├── usersRoutes.js
│ ├── blogsRoutes.js
│ └── adminRoutes.js
├── index.js
└── README.md

# How to Test with Postman HOW TO TEST WITH POSTMAN

# Users

- `POST /users/` – Register new user  
- `POST /users/login` – Login and receive JWT Token

> Copy the token and include it in your headers for protected routes:  
`Authorization: Bearer <your_token_here>`

- `GET /users/profile` – View logged-in user profile  
- `PUT /users/profile` – Update user profile

# Blog Posts

- `POST /blogs` – Create blog post  
- `PUT /blogs/:id` – Update blog post  
- `DELETE /blogs/:id` – Delete blog post  
- `GET /blogs` – View all blog posts  
- `GET /blogs/:id` – View single blog post

# Admin

- `POST /admin/category` – Create blog category  
- `GET /admin/categories` – View all blog categories

# Postman Documentation

Click the link below to access and test the API via Postman:

👉 [Postman Collection] [https://web.postman.co/workspace/My-Workspace~ce3feccd-4a91-473e-82a4-1681ce733f72/collection/40124402-2c615e71-739a-4a0f-b7ee-066a7063effd?action=share&source=copy-link&creator=40124402]

# Setup Instructions

1. Clone this repo:

```bash
git clone https://github.com/isrealiyaji/blogs-api.git
cd blogs-api

2. Install dependencies:

npm install

3. Set up your .env file with:
PORT=3600
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blogs_api
JWT_SECRET=your_secret_key

4. Run the server:

License
This project is licensed under the MIT License – see the LICENSE file for details.
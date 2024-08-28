const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://handicraft-businesses-server.vercel.app',
        'https://bangladeshi-handicrafts.web.app',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(cookieParser());

require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dfacken.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
};

// user MiddleWare
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}


async function run() {
    try {

        const userCollection = client.db('handicraftDB').collection('users')
        const shopCollection = client.db('handicraftDB').collection('shop')
        const orderCollection = client.db('handicraftDB').collection('order')

        // jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);

            const token = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: '30d'
                }
            )

            res
                .cookie('token', token, cookieOption)
                .send({ success: true })
        });

        app.get('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res
                .clearCookie('token', {
                    ...cookieOption,
                    maxAge: 0
                })
                .send({ success: true })
        })

        // User
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const users = await cursor.toArray();
            res.send(users);
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const cursor = userCollection.findOne((user) => user.email === email);

            res.send(cursor);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log('New USer: ', user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.patch('/users', async (req, res) => {
            const user = req.body
            const filter = { email: user.email };
            const updatedDoc = {
                $set: {
                    lastLoginAt: user.lastLoginAt
                }
            }

            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.put('/users/:email', (req, res) => {
            const email = req.params.email;
            const { fullName, phoneNumber, imageUrl, address } = req.body;

            // Find the user by email
            const userIndex = users.findIndex((user) => user.email === email);

            if (userIndex !== -1) {
                // Update user info
                users[userIndex] = {
                    ...users[userIndex],
                    name: fullName,
                    phoneNumber,
                    photoURL: imageUrl,
                    address,
                };

                // Respond with the updated user
                res.status(200).json({ message: 'Profile updated successfully!', user: users[userIndex] });
            } else {
                // User not found
                res.status(404).json({ message: 'User not found' });
            }
        });


        // shop
        app.get('/shop', async (req, res) => {
            const shop = await shopCollection.find().toArray();
            res.send(shop);
        })
        app.get('/shop/:id', async (req, res) => {
            const id = req.params.id;

            const queary = { _id: new ObjectId(id) };

            const result = await shopCollection.findOne(queary);
            if (result) {
                res.send(result);
            } else {
                res.status(404).send({ message: 'Product not found' });
            }
        })

        // order
        app.get('/order', async (req, res) => {
            const cursor = await orderCollection.find().toArray();
            res.send(cursor);
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const { productId, quantity } = order;
            console.log('order: ', order);

            const result = await orderCollection.insertOne(order);
            res.json(result);
        })

        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            const queary = { userEmail: email };
            const result = await orderCollection.find(queary).toArray();
            res.send(result);
        })


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Handicraft Businesses server is running')
})

app.listen(port, () => {
    console.log(`Handicraft Businesses server running on port: ${port}`);
})
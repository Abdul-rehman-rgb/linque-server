import express from 'express'
import cors from 'cors'
import connectToDatabase from './db/db.js'
import authRouter from './routes/auth.js'


connectToDatabase() 
const app = express() 
app.use(cors());
app.use(express.json())
// app.use(express.static('public/uploads'))

app.use('/api/auth', authRouter)


app.listen(process.env.PORT, () => {
    console.log(`Server is Running on port ${process.env.PORT}`)
})
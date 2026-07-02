import express from "express";

const app = express();
const port = 8000;

app.get('/', (req, res) => {
    res.send('Hello');
});

app.listen(port, ()=> {
    console.log(`Listening port  ${port}`);
})

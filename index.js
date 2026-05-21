const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    const db = client.db("doc-appointment");

    const allDoctorsCollection = db.collection("all-doctors");
    const appointmentsCollection = db.collection("appointments");

    app.get("/all-doctors", async (req, res) => {
      const doctors = await allDoctorsCollection.find().toArray();
      res.json(doctors);
    });

    app.get("/all-doctors/:id", async (req, res) => {
      const docId = req.params.id;
      const query = { _id: new ObjectId(docId) };
      const doctor = await allDoctorsCollection.findOne(query);

      res.json(doctor);
    });

    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);

      res.json(result);
    });

    app.get("/appointments/:userId", async (req, res) => {
      const { userId } = req.params;
      const query = { userId: userId };

      const appointments = await appointmentsCollection.find(query).toArray();

      res.json(appointments);
    });

    app.patch("/appointments/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const result = await appointmentsCollection.updateOne(filter, {
        $set: updatedData,
      });

      res.json(result);
    });

    // ===============================================

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running well");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

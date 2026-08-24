import { connectDB } from "./config/db.js";
import { Server } from "./app.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  Server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
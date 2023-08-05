// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

// Create an Express app
const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Use body-parser middleware to parse the request body
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static("public"));

// Connect to the MongoDB database named "todolistDB"
mongoose.connect("mongodb://localhost/todolistDB");

// Define the Mongoose schema for items
const itemsSchema = {
  name: String
};

// Create the Mongoose model for items
const Item = mongoose.model("Item", itemsSchema);

// Create default items for the todo list
const item1 = new Item({
  name: "Welcome to your todoList",
});

const item2 = new Item({
  name: "Welcome to your todoList 2",
});

const item3 = new Item({
  name: "Welcome to your todoList 3",
});

const defaultItems = [item1, item2, item3];

// Define the Mongoose schema for custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]
}

// Create the Mongoose model for custom lists
const List = mongoose.model("List", listSchema);

// Function to insert default items into the database
async function insertDefaultItems(defaultItems) {
  try {
    const existingItems = await Item.find({ name: { $in: defaultItems.map((item) => item.name) } });
    const existingItemsArray = Array.isArray(existingItems) ? existingItems : [];

    const newItems = defaultItems.filter((defaultItem) => {
      return !existingItemsArray.some((existingItem) => existingItem.name === defaultItem.name);
    });

    if (newItems.length > 0) {
      await Item.insertMany(newItems);
      console.log("New items added:", newItems);
    } else {
      // No new items to add.
    }
  } catch (err) {
    console.error("Error inserting default items:", err);
  }
}

// Call the function to insert default items (if not already present)
insertDefaultItems(defaultItems);

// Route to handle the home page
app.get("/", function(req, res) {
  Item.find({})
    .then((foundItems) => {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    })
    .catch((err) => {
      console.error("Error fetching items:", err);
      // Handle the error and send an appropriate response
    });
});

// Route to handle custom lists
app.get("/:customListname", async (req, res) => {
  const customListname = req.params.customListname;
  try {
    const foundList = await List.findOne({ name: customListname });
    if (!foundList) {
      const newList = new List({
        name: customListname,
        items: [], // Initialize with an empty array for custom lists
      });

      await newList.save();
      res.redirect("/" + customListname);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error("Error finding list:", err);
    // Handle the error and send an appropriate response
  }
});

// Route to handle adding new items to the todo list
app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log("List not found:", listName);
        // Handle the case when the list is not found and send an appropriate response
      }
    } catch (err) {
      console.error("Error finding list:", err);
      // Handle the error and send an appropriate response
    }
  }
});

// Route to handle deleting items from the todo list
app.post("/delete", (req, res) => {
  let itemIdsToDelete = req.body.checkbox; // Use 'req.body.checkbox' to get an array

  console.log("Items to delete:", itemIdsToDelete); // Add this line to check the values

  // If only one item is selected, convert it to an array
  if (!Array.isArray(itemIdsToDelete)) {
    itemIdsToDelete = [itemIdsToDelete];
  }

  Item.deleteMany({ _id: { $in: itemIdsToDelete } })
    .then(() => {
      console.log("Items deleted successfully.");
      res.redirect("/");
    })
    .catch((err) => {
      console.error("Error deleting items:", err);
      res.status(500).send("Error deleting items.");
    });
});

// Route to handle the "Work" list
app.get("/work", function(req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

// Route to handle the "About" page
app.get("/about", function(req, res) {
  res.render("about");
});

// Start the server and listen on port 3000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});

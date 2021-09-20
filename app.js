//jshint esversion:6

const express = require("express");
const app = express();
const _ = require("lodash");

const mongoose = require("mongoose");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Item 1",
});

const item2 = new Item({
  name: "Item 2",
});

const item3 = new Item({
  name: "Item 3",
});

const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (!err) {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
      // if (foundItems.length == 0) {
      //   // Item.insertMany(defaultItems, function (err) {
      //   //   if (!err) {
      //   //     console.log("Successfully saved default items to DB.");
      //   //   }
      //   // });
      //   res.redirect("/");
      // } else {
      //   res.render("list", { listTitle: "Today", newListItems: foundItems });
      // }
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customName = _.capitalize(req.params.customListName);
  console.log("NAME: " + customName);
  List.findOne({ name: customName }, function (err, foundList) {
    if (!err) {
      //console.log("LINE 67: " + foundList);
      if (!foundList) {
        //console.log("LINE 70: " + foundList);
        //Create a new list
        const list = new List({
          name: customName,
          items: defaultItems,
        });
        //console.log("Does not Exist");

        list.save(() => res.redirect("/" + customName));
        //res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

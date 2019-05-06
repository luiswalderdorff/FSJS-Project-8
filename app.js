const express = require("express");
const app = express();
const Book = require("./models").Book;
const sequelize = require("./models").sequelize;


app.use("/static", express.static("public"));

app.set('view engine', 'pug');

// Makes me able to parse data from body (for req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Home route, redirects to /books
app.get('/', (req, res) => {
  res.redirect("/books");
});


// Shows the full list of books
app.get('/books', (req, res) => {
    Book.findAll({order: [["title", "ASC"]]}).then(function(books) { //gets all books for main page and orders them 
    res.render("index", {books: books, title: "Book List" });
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  });
});

// Shows the create new book form
app.get('/books/new', (req, res) => {
    res.render("new-book", {title: "New Book", book: Book.build()})
});

// Posts a new book to the database
app.post('/books/new', (req, res) => {
    Book.create(req.body).then(function(book) { 
    res.redirect("/books/" + book.id); 
  }).catch(function(err) {
    if(err.name === "SequelizeValidationError") { 
      res.render("new-book", {
        book: Book.build(req.body), //adds already entered info
        title: "New Book",
        errors: err.errors //errors array in err, gets added in new --> error view. Before empty so not there
      });
    } else {
      throw err; //handled by the final catch
    }
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  })
});


// Shows book detail form
app.get('/books/:id', (req, res) => {
    Book.findByPk(req.params.id).then(function(book) { 
    if(book) { //only do if book exists (example entering invalid id, 
      res.render("update-book", {book: book, title: "Edit Book"});
    } else {
      const err = "This book does not exist yet.";
      res.render("page-not-found", { error: err });
    }
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  });   
});


// Updates book info in the database
app.post('/books/:id', (req, res) => {
	Book.findByPk(req.params.id).then(function(book) { 
    if(book) {
      return book.update(req.body);//updates book
      } else {
      res.send(404);
    }
  }).then(function(book) {
    res.redirect("/books/" + book.id); //redirects to correct book
  }).catch(function(err) {
    if(err.name === "SequelizeValidationError") {
      const book = Book.build(req.body);
      book.id = req.params.id; // Need to add id so correct book is updated. Is in url
      res.render("update-book", { //Same as above POST
        book: book, //adds already entered info
        title: "Edit Book",
        errors: err.errors //errors array in err, gets added in new --> error view. Before empty so not there
      });
    } else {
      throw err; //handled by the final catch
    }
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  });  
});


// Deletes a book. Careful, this can’t be undone. It can be helpful to create a new “test” book to test deleting
app.post('/books/:id/delete', (req, res) => { 
	Book.findByPk(req.params.id).then(function(book) { //replaces findById. Method of Book class
    if(book) {
      return book.destroy();
    } else {
      res.send(404);
    }
  }).then(function() {
    res.redirect("/books");
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  }); 
});

// No page reached
app.use((req, res, next) => { //creates error
  const err = new Error("Whoops! This page does not exist.");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => { //displays error
  res.status(err.status);
  res.render("page-not-found", { error: err });
  console.log(err);
  next(err);
});

sequelize.sync().then(function () {
  app.listen(3000, () => {
    console.log('The application is running on localhost:3000!');
});
})



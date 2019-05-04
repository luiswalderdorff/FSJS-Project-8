const express = require("express");
const app = express();
const Book = require("./models").Book;
const sequelize = require("./models").sequelize;


app.use("/static", express.static("public"));

app.set('view engine', 'pug');

// Home route, redirects to /books
app.get('/', (req, res) => {
  res.redirect("/books");
});


// Shows the full list of books
app.get('/books', (req, res) => {
    Book.findAll({order: [["title", "DESC"]]}).then(function(books) { //gets all articles for main page and orders them 
    res.render("index", {books: books, title: "Book List" });
  }).catch(function(err) {
    res.send(500);
  });
});

// Shows the create new book form
app.get('/books/new', (req, res) => {
    res.render("new-book", {title: "New Book", book: Book.build()})
});

// Posts a new book to the database
app.post('/books', (req, res) => {
    Book.create(req.body).then(function(book) { 
    res.redirect("/books/" + book.id); 
  }).catch(function(err) {
    if(err.name === "SequelizeValidationError") { 
      res.render("book/new", {
        article: Book.build(req.body), //adds already entered info
        title: "New Book",
        errors: err.errors //errors array in err, gets added in new --> error view. Before empty so not there
      });
    } else {
      throw err; //handled by the final catch
    }
  }).catch(function(err) {
    res.send(500);
  });
});


// Shows book detail form
app.get('/books/:id', (req, res) => {
    Book.findByPk(req.params.id).then(function(book) { 
    if(book) { //only do if book exists (example entering invalid id, 
      res.render("update-book", {book: book, title: "Edit Book"});
    } else {
      res.send(404);
    }
  }).catch(function(err) {
    res.send(500);
  });   
});


// Updates book info in the database
app.put('/books/:id', (req, res) => {
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
    res.send(500);
  });  
});


// Deletes a book. Careful, this can’t be undone. It can be helpful to create a new “test” book to test deleting
app.delete('/books/:id/delete', (req, res) => { 
	Book.findByPk(req.params.id).then(function(book) { //replaces findById. Method of Article class
    if(book) {
      return book.destroy();
    } else {
      res.send(404);
    }
  }).then(function() {
    res.redirect("/books");
  }).catch(function(err) {
    res.send(500);
  }); 
});

sequelize.sync().then(function () {
  app.listen(3000, () => {
    console.log('The application is running on localhost:3000!');
    console.log(Book);
});
})



$(document).ready(function() {
  const $books = $("#books");
  const $booksView = $("#books-view");
  const $rowToggle = $("#row-toggle");
  const $scrollToggle = $("#scroll-toggle");

  function applyLayout() {
    const rowMode = $rowToggle.val();
    const scrollMode = $scrollToggle.val();

    $books
      .removeClass("layout-one-row layout-two-rows orientation-horizontal orientation-vertical")
      .addClass(rowMode === "one" ? "layout-one-row" : "layout-two-rows")
      .addClass(scrollMode === "horizontal" ? "orientation-horizontal" : "orientation-vertical");

    $booksView
      .removeClass("scroll-horizontal scroll-vertical")
      .addClass(scrollMode === "horizontal" ? "scroll-horizontal" : "scroll-vertical");
  }

  $rowToggle.on("change", applyLayout);
  $scrollToggle.on("change", applyLayout);

  $.getJSON("json/books.json", function(books) {
    var length = books.length;
    // console.log(length);

    for (var i = 1; i < length + 1; i++) {
      $books.append(
        '<img class = "book-images" draggable = "true" id = ' + i + ' src = "jpg/' + i + '.jpg">'
      );
      getSize(i);
    }

    $("#reading-book").html(books[length - 1].Title);

    $(".book-images").hover(function() {
      $("#number").html("(#" + books[this.id - 1].Number + ")");
      $("#title").html(books[this.id - 1].Title);
      $("#author").html(books[this.id - 1].Author);
      // console.log(this.id);
      $("#description").css("display", "flex");
    }, function() {
      $("#description").css("display", "none");
    });
    applyLayout();
  });

  initializeDragAndDrop();

  function getSize(number) {
    var img = document.getElementById(number);

    img.onload = function() {
      var width = img.naturalWidth;
      var height = img.naturalHeight;

      var w = window.innerWidth;

      if (w <= 1500 && w >= 1200) {
        var newWidth = width / 5;
        var newHeight = height / 5;
      }
      else if (w <= 1200) {
        var newWidth = width / 6;
        var newHeight = height / 6;
      }
      else if (w >= 1500) {
        var newWidth = width / 3;
        var newHeight = height / 3;
      }

      widthString = newWidth.toString();
      heightString = newHeight.toString();

      img.style.height = heightString + 'px';
      img.style.width = widthString + 'px';
    }
  }

  function initializeDragAndDrop() {
    var draggedElement = null;

    $books.on("dragstart", ".book-images", function(event) {
      draggedElement = this;
      event.originalEvent.dataTransfer.effectAllowed = "move";
      event.originalEvent.dataTransfer.setData("text/plain", this.id);
      $(this).addClass("is-dragging");
    });

    $books.on("dragend", ".book-images", function() {
      $(this).removeClass("is-dragging");
      $books.find(".drop-target").removeClass("drop-target");
      draggedElement = null;
    });

    $books.on("dragenter", ".book-images", function() {
      if (this !== draggedElement) {
        $(this).addClass("drop-target");
      }
    });

    $books.on("dragover", ".book-images", function(event) {
      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = "move";
    });

    $books.on("dragleave", ".book-images", function() {
      $(this).removeClass("drop-target");
    });

    $books.on("drop", ".book-images", function(event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).removeClass("drop-target");

      if (!draggedElement || draggedElement === this) {
        return;
      }

      var $dragged = $(draggedElement);
      var $target = $(this);

      if ($dragged.index() < $target.index()) {
        $target.after($dragged);
      } else {
        $target.before($dragged);
      }
    });

    $books.on("dragover", function(event) {
      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = "move";
    });

    $books.on("drop", function(event) {
      event.preventDefault();

      if (!draggedElement) {
        return;
      }

      if (event.target === this) {
        $(this).append(draggedElement);
      }
    });
  }

  applyLayout();
});

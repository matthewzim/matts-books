$(document).ready(function() {
  const $books = $("#books");
  const $booksView = $("#books-view");
  const $rowToggle = $("#row-toggle");
  const $scrollToggle = $("#scroll-toggle");
  const $interactionToggle = $("#interaction-toggle");
  let interactionMode = $interactionToggle.val();
  let draggedElement = null;

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
  $interactionToggle.on("change", applyInteractionMode);

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

    $books.on("mouseenter", ".book-images", function() {
      if (interactionMode !== "info") {
        return;
      }

      $("#number").html("");
      $("#title").html(books[this.id - 1].Title);
      $("#author").html(books[this.id - 1].Author);
      $("#description").css("display", "flex");
    });

    $books.on("mouseleave", ".book-images", function() {
      if (interactionMode !== "info") {
        return;
      }

      $("#description").css("display", "none");
    });

    applyLayout();
    applyInteractionMode();
  });

  initializeDragAndDrop();

  function applyInteractionMode() {
    interactionMode = $interactionToggle.val();
    const isDragMode = interactionMode === "drag";

    $books
      .toggleClass("mode-drag", isDragMode)
      .toggleClass("mode-info", !isDragMode)
      .find(".book-images")
      .attr("draggable", isDragMode);

    if (isDragMode) {
      $("#description").css("display", "none");
    } else {
      draggedElement = null;
      $books.find(".book-images").removeClass("is-dragging drop-target");
    }
  }

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
    $books.on("dragstart", ".book-images", function(event) {
      if (interactionMode !== "drag") {
        event.preventDefault();
        return;
      }

      draggedElement = this;
      event.originalEvent.dataTransfer.effectAllowed = "move";
      event.originalEvent.dataTransfer.setData("text/plain", this.id);
      $(this).addClass("is-dragging");
    });

    $books.on("dragend", ".book-images", function() {
      if (interactionMode !== "drag") {
        return;
      }

      $(this).removeClass("is-dragging");
      $books.find(".drop-target").removeClass("drop-target");
      draggedElement = null;
    });

    $books.on("dragenter", ".book-images", function() {
      if (interactionMode !== "drag") {
        return;
      }

      if (this !== draggedElement) {
        $(this).addClass("drop-target");
      }
    });

    $books.on("dragover", ".book-images", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = "move";
    });

    $books.on("dragleave", ".book-images", function() {
      if (interactionMode !== "drag") {
        return;
      }

      $(this).removeClass("drop-target");
    });

    $books.on("drop", ".book-images", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

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
      if (interactionMode !== "drag") {
        return;
      }

      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = "move";
    });

    $books.on("drop", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

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
  applyInteractionMode();
});

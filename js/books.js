$(document).ready(function() {
  const $books = $("#books");
  const $booksView = $("#books-view");
  const $layoutControls = $("#layout-controls");
  const $bottomMenu = $("#bottom-menu");
  const $menuToggle = $("#layout-menu-toggle");
  const $themeToggle = $("#theme-toggle");
  const $rowToggle = $("#row-toggle");
  const $scrollToggle = $("#scroll-toggle");
  const $interactionToggle = $("#interaction-toggle");
  const rootElement = document.documentElement;
  let interactionMode = $interactionToggle.val();
  let draggedElement = null;

  function closeLayoutMenu() {
    if (!$bottomMenu.hasClass("is-open")) {
      return;
    }

    $bottomMenu.removeClass("is-open");
    $menuToggle.attr("aria-expanded", "false");
    $layoutControls.attr("aria-hidden", "true");
  }

  $menuToggle.on("click", function(event) {
    event.stopPropagation();

    const willOpen = !$bottomMenu.hasClass("is-open");
    $bottomMenu.toggleClass("is-open", willOpen);
    $menuToggle.attr("aria-expanded", willOpen);
    $layoutControls.attr("aria-hidden", !willOpen);
  });

  $layoutControls.on("click", function(event) {
    event.stopPropagation();
  });

  $(document).on("click", function() {
    closeLayoutMenu();
  });

  $(document).on("keydown", function(event) {
    if (event.key === "Escape") {
      closeLayoutMenu();
    }
  });

  function applyLayout() {
    const rowMode = $rowToggle.val();
    const scrollMode = $scrollToggle.val();

    $books
      .removeClass("layout-one-row layout-two-rows orientation-horizontal orientation-vertical")
      .addClass(rowMode === "one" ? "layout-one-row" : "layout-two-rows")
      .addClass(scrollMode === "horizontal" ? "orientation-horizontal" : "orientation-vertical");

    $booksView
      .removeClass("scroll-horizontal scroll-vertical view-one-row view-two-rows")
      .addClass(scrollMode === "horizontal" ? "scroll-horizontal" : "scroll-vertical")
      .addClass(rowMode === "one" ? "view-one-row" : "view-two-rows");
  }

  function applyTheme() {
    const theme = $themeToggle.val();
    rootElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("mb-theme", theme);
    } catch (error) {
      // Ignore storage errors (e.g. private mode)
    }
  }

  $rowToggle.on("change", applyLayout);
  $scrollToggle.on("change", applyLayout);
  $interactionToggle.on("change", applyInteractionMode);
  $themeToggle.on("change", applyTheme);

  const storedTheme = (function() {
    try {
      return localStorage.getItem("mb-theme");
    } catch (error) {
      return null;
    }
  })();

  if (storedTheme === "dark" || storedTheme === "light") {
    $themeToggle.val(storedTheme);
  }

  applyTheme();

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
      var divisor;

      if (w >= 1500) {
        divisor = 3;
      } else if (w >= 1200) {
        divisor = 5;
      } else {
        divisor = 6;
      }

      var scaleFactor = 1.25;
      var newWidth = (width / divisor) * scaleFactor;
      var newHeight = (height / divisor) * scaleFactor;

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
  applyTheme();

  // Keep controls accessible for keyboard navigation when opened via focus.
  $menuToggle.on("focusout", function(event) {
    if ($bottomMenu.has(event.relatedTarget).length === 0) {
      closeLayoutMenu();
    }
  });

  $layoutControls.on("focusout", function(event) {
    if ($bottomMenu.has(event.relatedTarget).length === 0) {
      closeLayoutMenu();
    }
  });
});

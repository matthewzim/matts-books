import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BASE_SCALE = 1.25;
const MIN_VARIATION = 0.9;
const MAX_VARIATION = 1.1;
const OVERFLOW_END_CLASS = 'is-at-end';

function getDivisor() {
  const width = typeof window !== 'undefined' ? window.innerWidth || 0 : 0;

  if (width >= 1500) {
    return 3;
  }

  if (width >= 1200) {
    return 5;
  }

  return 6;
}

function getBookVariation(bookNumber) {
  const number = Number(bookNumber);

  if (!Number.isFinite(number)) {
    return 1;
  }

  const seededRandom = Math.sin(number * 12.9898) * 43758.5453;
  const fraction = seededRandom - Math.floor(seededRandom);

  return MIN_VARIATION + fraction * (MAX_VARIATION - MIN_VARIATION);
}

function updateBookDimensionsElement(img) {
  if (!img) {
    return;
  }

  const naturalWidth = Number(img.dataset.naturalWidth || 0);
  const naturalHeight = Number(img.dataset.naturalHeight || 0);

  if (!naturalWidth || !naturalHeight) {
    return;
  }

  const sizeVariation = Number(img.dataset.sizeVariation || 1);
  const divisor = getDivisor();
  const scale = BASE_SCALE * sizeVariation;
  const newWidth = (naturalWidth / divisor) * scale;
  const newHeight = (naturalHeight / divisor) * scale;

  img.style.width = `${newWidth}px`;
  img.style.height = `${newHeight}px`;
}

function clearBookPlacement(items) {
  items.forEach((item) => {
    const element = item;
    element.style.gridRow = '';
    element.style.gridColumn = '';
    element.style.left = '';
    element.style.top = '';
    element.style.position = '';
  });
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [rowMode, setRowMode] = useState('overflow');
  const [interactionMode, setInteractionMode] = useState('drag');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredBookId, setHoveredBookId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString()
  );
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const booksRef = useRef(null);
  const booksViewRef = useRef(null);
  const bottomMenuRef = useRef(null);
  const arrangementFrameRef = useRef(null);
  const draggedIdRef = useRef(null);
  const storedTheme = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    try {
      const savedTheme = window.localStorage.getItem('mb-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    } catch (error) {
      // Ignore storage errors (e.g. private mode)
    }

    return 'light';
  }, []);
  const [theme, setTheme] = useState(storedTheme);

  useEffect(() => {
    let isMounted = true;

    fetch('/json/books.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load books.');
        }

        return response.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setBooks(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBooks([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem('mb-theme', theme);
    } catch (error) {
      // Ignore storage errors (e.g. private mode)
    }
  }, [theme]);

  const updateOverflowBorderState = useCallback(() => {
    const booksViewElement = booksViewRef.current;

    if (!booksViewElement) {
      return;
    }

    if (rowMode !== 'overflow') {
      booksViewElement.classList.remove(OVERFLOW_END_CLASS);
      return;
    }

    const maxScrollLeft = Math.max(
      booksViewElement.scrollWidth - booksViewElement.clientWidth,
      0
    );
    const threshold = 1;
    const isAtEnd =
      maxScrollLeft <= threshold ||
      booksViewElement.scrollLeft >= maxScrollLeft - threshold;

    booksViewElement.classList.toggle(OVERFLOW_END_CLASS, isAtEnd);
  }, [rowMode]);

  const applyWrapLayout = useCallback(() => {
    arrangementFrameRef.current = null;

    const rowSelection = rowMode;
    const booksElement = booksRef.current;
    const booksViewElement = booksViewRef.current;

    if (!booksElement) {
      updateOverflowBorderState();
      return;
    }

    const items = Array.from(booksElement.children);

    if (!items.length) {
      booksElement.style.width = '';
      booksElement.style.height = '';
      updateOverflowBorderState();
      return;
    }

    clearBookPlacement(items);

    if (rowSelection !== 'wrap') {
      booksElement.style.width = '';
      booksElement.style.height = '';
      updateOverflowBorderState();
      return;
    }

    const availableWidth = booksViewElement?.clientWidth || 0;

    if (!availableWidth) {
      booksElement.style.width = '';
      booksElement.style.height = '';
      updateOverflowBorderState();
      return;
    }

    const computedStyle = window.getComputedStyle(booksElement);
    const columnGapValue = parseFloat(computedStyle.columnGap);
    const columnGap = Number.isFinite(columnGapValue) ? columnGapValue : 0;
    const rowGapValue = parseFloat(computedStyle.rowGap);
    const rowGap = Number.isFinite(rowGapValue) ? rowGapValue : 0;

    const rows = [];
    let currentRowItems = [];
    let currentLeft = 0;
    let maxRowHeight = 0;

    const finalizeRow = () => {
      if (!currentRowItems.length) {
        return;
      }

      rows.push({
        items: currentRowItems,
        height: maxRowHeight,
        width: currentLeft,
      });

      currentRowItems = [];
      currentLeft = 0;
      maxRowHeight = 0;
    };

    items.forEach((element) => {
      const elementWidth = Math.ceil(element.offsetWidth) || 0;
      const elementHeight = Math.ceil(element.offsetHeight) || 0;

      let nextLeft = currentRowItems.length ? currentLeft + columnGap : 0;
      let predictedWidth = nextLeft + elementWidth;

      if (
        currentRowItems.length &&
        availableWidth &&
        predictedWidth > availableWidth
      ) {
        finalizeRow();
        nextLeft = 0;
        predictedWidth = elementWidth;
      }

      currentRowItems.push({
        element,
        width: elementWidth,
        height: elementHeight,
        left: nextLeft,
      });

      currentLeft = predictedWidth;

      if (elementHeight > maxRowHeight) {
        maxRowHeight = elementHeight;
      }
    });

    finalizeRow();

    if (!rows.length) {
      booksElement.style.width = '';
      booksElement.style.height = '';
      updateOverflowBorderState();
      return;
    }

    let contentHeight = 0;
    let maxRowWidth = 0;

    rows.forEach((row, rowIndex) => {
      if (row.width > maxRowWidth) {
        maxRowWidth = row.width;
      }

      const baseTop = contentHeight;

      row.items.forEach((item) => {
        const offset = row.height - item.height;
        const topPosition = baseTop + (offset > 0 ? offset : 0);

        const element = item.element;
        element.style.position = 'absolute';
        element.style.left = `${item.left}px`;
        element.style.top = `${topPosition}px`;
      });

      contentHeight += row.height;

      if (rowIndex < rows.length - 1) {
        contentHeight += rowGap;
      }
    });

    booksElement.style.width = maxRowWidth ? `${maxRowWidth}px` : '';
    booksElement.style.height = contentHeight ? `${contentHeight}px` : '';
    updateOverflowBorderState();
  }, [rowMode, updateOverflowBorderState]);

  const scheduleBookArrangement = useCallback(() => {
    if (arrangementFrameRef.current !== null) {
      cancelAnimationFrame(arrangementFrameRef.current);
    }

    arrangementFrameRef.current = requestAnimationFrame(applyWrapLayout);
  }, [applyWrapLayout]);

  const updateAllBookDimensions = useCallback(() => {
    const booksElement = booksRef.current;

    if (!booksElement) {
      return;
    }

    const items = booksElement.querySelectorAll('.book-images');
    items.forEach((item) => updateBookDimensionsElement(item));
  }, []);

  const applyLayout = useCallback(() => {
    const booksElement = booksRef.current;
    const booksViewElement = booksViewRef.current;

    if (!booksElement || !booksViewElement) {
      return;
    }

    booksElement.classList.remove(
      'layout-overflow',
      'layout-wrap',
      'orientation-horizontal'
    );
    booksElement.classList.add(
      rowMode === 'wrap' ? 'layout-wrap' : 'layout-overflow',
      'orientation-horizontal'
    );

    booksViewElement.classList.remove(
      'scroll-horizontal',
      'view-overflow',
      'view-wrap'
    );
    booksViewElement.classList.add('scroll-horizontal');
    booksViewElement.classList.add(
      rowMode === 'overflow' ? 'view-overflow' : 'view-wrap'
    );

    updateOverflowBorderState();
    scheduleBookArrangement();
  }, [rowMode, scheduleBookArrangement, updateOverflowBorderState]);

  const applyInteractionMode = useCallback(() => {
    const booksElement = booksRef.current;

    if (!booksElement) {
      return;
    }

    const isDragMode = interactionMode === 'drag';
    booksElement.classList.toggle('mode-drag', isDragMode);
    booksElement.classList.toggle('mode-info', !isDragMode);

    if (!isDragMode) {
      setDraggingId(null);
      setDropTargetId(null);
      draggedIdRef.current = null;
    }
  }, [interactionMode]);

  const handleWindowResize = useCallback(() => {
    updateAllBookDimensions();
    scheduleBookArrangement();
    updateOverflowBorderState();
  }, [scheduleBookArrangement, updateAllBookDimensions, updateOverflowBorderState]);

  useEffect(() => {
    const element = booksViewRef.current;

    if (!element) {
      return undefined;
    }

    const handleScroll = () => updateOverflowBorderState();
    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [updateOverflowBorderState]);

  useEffect(() => {
    applyLayout();
  }, [applyLayout, books]);

  useEffect(() => {
    applyInteractionMode();
  }, [applyInteractionMode, books]);

  useEffect(() => {
    updateAllBookDimensions();
    scheduleBookArrangement();
  }, [books, scheduleBookArrangement, updateAllBookDimensions]);

  useEffect(() => {
    const handleResize = () => handleWindowResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [handleWindowResize]);

  useEffect(() => {
    return () => {
      if (arrangementFrameRef.current !== null) {
        cancelAnimationFrame(arrangementFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    updateOverflowBorderState();
  }, [updateOverflowBorderState, books, rowMode]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!menuOpen) {
        return;
      }

      const bottomMenuElement = bottomMenuRef.current;

      if (bottomMenuElement && bottomMenuElement.contains(event.target)) {
        return;
      }

      setMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleImageLoad = useCallback(
    (event, bookNumber) => {
      const img = event.currentTarget;
      const variation = getBookVariation(bookNumber);

      img.dataset.naturalWidth = img.naturalWidth;
      img.dataset.naturalHeight = img.naturalHeight;
      img.dataset.sizeVariation = variation;

      updateBookDimensionsElement(img);
      scheduleBookArrangement();
    },
    [scheduleBookArrangement]
  );

  const handleDragStart = useCallback(
    (event, bookId) => {
      if (interactionMode !== 'drag') {
        event.preventDefault();
        return;
      }

      draggedIdRef.current = bookId;
      setDraggingId(bookId);
      setDropTargetId(null);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(bookId));
    },
    [interactionMode]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetId(null);
    draggedIdRef.current = null;
  }, []);

  const handleDragEnter = useCallback(
    (bookId) => {
      if (interactionMode !== 'drag') {
        return;
      }

      if (draggedIdRef.current && draggedIdRef.current !== bookId) {
        setDropTargetId(bookId);
      }
    },
    [interactionMode]
  );

  const handleDragLeave = useCallback(() => {
    if (interactionMode !== 'drag') {
      return;
    }

    setDropTargetId(null);
  }, [interactionMode]);

  const handleDropOnBook = useCallback(
    (event, targetId) => {
      if (interactionMode !== 'drag') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const sourceId = draggedIdRef.current;

      if (!sourceId || sourceId === targetId) {
        return;
      }

      setBooks((previous) => {
        const updated = [...previous];
        const fromIndex = updated.findIndex((book) => book.Number === sourceId);
        const toIndex = updated.findIndex((book) => book.Number === targetId);

        if (fromIndex === -1 || toIndex === -1) {
          return previous;
        }

        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });

      setDropTargetId(null);
      setDraggingId(null);
      draggedIdRef.current = null;
    },
    [interactionMode]
  );

  const handleDragOver = useCallback(
    (event) => {
      if (interactionMode !== 'drag') {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [interactionMode]
  );

  const handleContainerDrop = useCallback(
    (event) => {
      if (interactionMode !== 'drag') {
        return;
      }

      event.preventDefault();

      const sourceId = draggedIdRef.current;

      if (!sourceId) {
        return;
      }

      setBooks((previous) => {
        const updated = [...previous];
        const fromIndex = updated.findIndex((book) => book.Number === sourceId);

        if (fromIndex === -1 || fromIndex === updated.length - 1) {
          return previous;
        }

        const [moved] = updated.splice(fromIndex, 1);
        updated.push(moved);
        return updated;
      });

      setDropTargetId(null);
      setDraggingId(null);
      draggedIdRef.current = null;
    },
    [interactionMode]
  );

  const handleThemeChange = useCallback((event) => {
    setTheme(event.target.value);
  }, []);

  const handleRowModeChange = useCallback((event) => {
    setRowMode(event.target.value);
  }, []);

  const handleInteractionModeChange = useCallback((event) => {
    setInteractionMode(event.target.value);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setMenuOpen((previous) => !previous);
  }, []);

  const handleMouseEnter = useCallback(
    (bookId) => {
      if (interactionMode !== 'info') {
        return;
      }

      setHoveredBookId(bookId);
    },
    [interactionMode]
  );

  const handleMouseLeave = useCallback(() => {
    if (interactionMode !== 'info') {
      return;
    }

    setHoveredBookId(null);
  }, [interactionMode]);

  const hoveredBook = hoveredBookId
    ? books.find((book) => book.Number === hoveredBookId)
    : null;

  const currentlyReading = books.length
    ? books[books.length - 1].Title
    : 'Loading…';

  const descriptionVisible = interactionMode === 'info' && hoveredBook;

  return (
    <div id="container">
      <div
        id="description"
        style={{ display: descriptionVisible ? 'flex' : 'none' }}
      >
        <div id="number">{hoveredBook?.Number ?? ''}</div>
        <div id="title">{hoveredBook?.Title ?? ''}</div>
        <div id="by">by</div>
        <div id="author">{hoveredBook?.Author ?? ''}</div>
      </div>
      <div id="books-container">
        <div id="books-view" ref={booksViewRef}>
          <div
            id="books"
            ref={booksRef}
            onDragOver={handleDragOver}
            onDrop={handleContainerDrop}
          >
            {books.map((book) => {
              const isDragging = draggingId === book.Number;
              const isDropTarget = dropTargetId === book.Number;

              return (
                <img
                  key={book.Number}
                  className={`book-images${
                    isDragging ? ' is-dragging' : ''
                  }${isDropTarget ? ' drop-target' : ''}`}
                  src={`/jpg/${book.Number}.jpg`}
                  alt={book.Title}
                  draggable={interactionMode === 'drag'}
                  onDragStart={(event) => handleDragStart(event, book.Number)}
                  onDragEnd={handleDragEnd}
                  onDragEnter={() => handleDragEnter(book.Number)}
                  onDragLeave={handleDragLeave}
                  onDrop={(event) => handleDropOnBook(event, book.Number)}
                  onDragOver={handleDragOver}
                  onMouseEnter={() => handleMouseEnter(book.Number)}
                  onMouseLeave={handleMouseLeave}
                  onLoad={(event) => handleImageLoad(event, book.Number)}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div id="shelf-desktop">
        <div>MATT'S BOOKS</div>
        <div
          id="bottom-menu"
          ref={bottomMenuRef}
          className={menuOpen ? 'is-open' : ''}
        >
          <button
            id="layout-menu-toggle"
            type="button"
            aria-expanded={menuOpen.toString()}
            aria-controls="layout-controls"
            onClick={handleMenuToggle}
          >
            Display options
          </button>
          <div
            id="layout-controls"
            aria-hidden={(!menuOpen).toString()}
            onClick={(event) => event.stopPropagation()}
          >
            <label htmlFor="theme-toggle">
              <span>Theme</span>
              <select
                id="theme-toggle"
                value={theme}
                onChange={handleThemeChange}
              >
                <option value="light">White</option>
                <option value="dark">Black</option>
              </select>
            </label>
            <label htmlFor="row-toggle">
              <span>Rows</span>
              <select id="row-toggle" value={rowMode} onChange={handleRowModeChange}>
                <option value="overflow">Overflow</option>
                <option value="wrap">Wrap</option>
              </select>
            </label>
            <label htmlFor="interaction-toggle">
              <span>Interaction</span>
              <select
                id="interaction-toggle"
                value={interactionMode}
                onChange={handleInteractionModeChange}
              >
                <option value="drag">Drag &amp; drop</option>
                <option value="info">View info</option>
              </select>
            </label>
          </div>
        </div>
        <div id="time">{currentTime}</div>
        <div>
          <div id="currently-reading">CURRENTLY READING</div>
          <div id="reading-book">{currentlyReading}</div>
        </div>
      </div>
      <div id="shelf-mobile">
        <div>MATT'S BOOKS</div>
      </div>
    </div>
  );
}

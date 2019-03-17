new Vue({
  el: "#container",
  data: {
    value: '1',
    books :[]
  },
  methods: {
    

  },
  mounted() {
    $.getJSON('json/books.json', json => {
      this.books = json
    })
  },
  beforeMount() {

  },
  watch: {

  }
})

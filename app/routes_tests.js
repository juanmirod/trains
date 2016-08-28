describe('Module routes', function() {
  
  describe('lines function', function() {

    beforeEach(function(){
      fech = function() {
        return {
          then: function(callback) {
            return callback({});
          }
        }
      } 
    })

    it('should return a Promise', function() {

      var lines = Routes.routes();
      expect(lines.then).toBeDefined();

    });

    it('should make a request for the lines page', function() {

      var spy = spyOn(window, 'fech');
      var lines = Routes.routes();
      expect(spy).toHaveBeenCalled();

    })
  })


});
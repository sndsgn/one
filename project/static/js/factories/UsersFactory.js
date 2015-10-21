app.factory('UsersFactory', ['$http', 
  function($http, $location, $window) {
    return {

//      checkUserExists: function(user) {
//       console.log('factory');
//        return $http({
//          method: 'POST',
//          url: '/usercheck',
//          data: user
//        });
//      },

      signup: function(user) {
        return $http({
          method: 'POST',
          url: '/signup',
          data: user
        });
      },

      login: function(user) {
       console.log('factory');
        return $http({
          method: 'POST',
          url: '/login',
          data: user
        });
      },

      logout: function(user) {
        return $http({
          method: 'POST',
          url: '/logout'
        });
      }
    };
}]);

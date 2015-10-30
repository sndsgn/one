app.controller('FeedController', ['$scope', 'PanelFactory', 'RedditFactory','TwitterFactory', 'InstagramFactory', 'SoundCloudFactory', 'PostType', '$location', '$sce', '$timeout', 'UsersFactory', 
  function ( $scope, PanelFactory, RedditFactory, TwitterFactory, InstagramFactory, SoundCloudFactory, PostType, $location, $sce, $timeout, UsersFactory ) {

  $scope.feed = [];

  $scope.checked = PanelFactory;   // This will be binded using the ps-open attribute

  var buildFeed = function (data, type, date) { 
    var theFeed  = [], 
       theDate, htmlFrame, obj;
    angular.forEach(data, function (item) {
      if (type === 'twitter') {
        obj = {
         text : item.text, 
         created_at: new Date(item.created_at),
         displayTime: moment(new Date(item.created_at)).fromNow(), 
         type: type, 
         user: {screen_name : item.user.screen_name}, 
         id_str: item.id_str 
        };
      } else {
        htmlFrame = $sce.trustAsHtml(item.embed);
        theDate = date ? new Date(item.time * 1000) : new Date(item.time);
        obj = {
         frame: htmlFrame, 
         created_at: theDate,
         displayTime: moment(theDate).fromNow(), 
         type: type
        };
      }
      theFeed.push(obj);
    });
    return theFeed;
  };

  $scope.isValidUser = function () {
    var user = sessionStorage.getItem('at');
    if (!user) {
      $location.path('home');
    } else {
      return true;
    }    
  };

  $scope.getRedditFeed = function ( ) {
    RedditFactory.getRedditFeed().then(function (data) {
      console.log(data);

    })
  }

  $scope.getTweets = function ( ) {
    TwitterFactory.getTweets().then(function ( data ) {
      if(Array.isArray(data.data)){
        var items = buildFeed(data.data, 'twitter');
        $scope.feed.push.apply($scope.feed, items);
      }
    });
  };
  $scope.favTweet = function ( id ) {
    TwitterFactory.favTweet(id).then(function ( response ) {
      console.log(response);
    });
  };

  $scope.reTweet = function ( id ) {
    TwitterFactory.reTweet(id).then(function ( response ) {
      console.log(response);
    });
  };

  $scope.postTweet = function ( tweet ) {
    var array = tweet.split("");
    for (var i = 0; i < array.length; i++) {
      switch(array[i]) {
        case ' ':
          array[i] = '%20';
          break;
        case '@':
          array[i] = '%40';
          break;
        case '#':
          array[i] = '%23';
          break;
        case '&':
          array[i] = '%26';
          break;
        case ':':
          array[i] = '&3A';
          break;
        case '/':
          array[i] = '%2F';
          break;
        default:
          array[i] = array[i];
      }
      // space as %20
      // @ as %40
      // # as %23
      // & as %26
      // colon as %3A
      // forward slash as %2F
    }
    tweet = array.join("");
    TwitterFactory.postTweet( tweet ).then(function ( response ) {
      console.log(response);
    });
  };

  $scope.getInstaFeed = function ( ) {
    InstagramFactory.getInstaFeed().then(function ( data ) {
      var items = buildFeed(data.data.data, 'instagram', true);
      $scope.feed.push.apply($scope.feed, items);
      if(data.data.is_more_data) {
        $scope.getInstaFeed();
      }
    });
  };

  $scope.getSoundFeed = function ( ) {
    SoundCloudFactory.getSongs().then(function (data) {
      var items = buildFeed(data.data.data, 'soundcloud');
      $scope.feed.push.apply($scope.feed, items);
      if(data.data.is_more_data) {
        $scope.getSoundFeed();
      }
    });
  };

  $scope.toggle = function( type ) {
    var beenCalled = false;

    angular.forEach($scope.feed, function ( post ) {
      if(post.type === type) {
        beenCalled = true;
      }
    });

    if (beenCalled === true) {  
      PostType[type] = !PostType[type];
    } else {
      switch(type) {
        case 'twitter':
          window.location.href = '/activate';
          break;
        case 'instagram':
          window.location.href = '/igAuth';
          break;
        case 'soundcloud':
          window.location.href = '/sound';
          break;
        default:
          console.log('default');        
      }
    }
  };

  $scope.panelToggle = function(){
    PanelFactory.checked = !PanelFactory.checked;
  };

  $scope.logout = function() {
    var authToken = sessionStorage.getItem('at');
    UsersFactory.logout({"at": authToken})
    .then(function ( res ) {
      sessionStorage.clear();
      $location.path('home');
    })
    .catch(function ( error ) {
      console.log(error);
    });
  };

 }])
  .factory('PostType', function ( ) {
    return {
      'twitter': false,
      'instagram': false,
      'soundcloud': false
    };
  })
  .factory('PanelFactory',[function ( ) {
    return {
      'checked': false
    };
  }])
  .filter('typeFilter', ['PostType', function (PostType) {
    return function ( input ) {
      var output = [];
      angular.forEach(input, function ( post ) {
        if ( PostType[post.type] === false) {
          if (post.type === 'instagram') {
            window.instgrm.Embeds.process();
          }
          output.push(post);
        }
      });
      return output;
    };
  }])
  .directive('poseidon', ['SliderFactory','$window', '$timeout',
  function (SliderFactory, $window, $timeout) {
    return {
      restrict: 'E',
      scope: {
      },
      link: function(scope, ele, attrs) {
        var dataset = [];
        var dataset2 = [{key: '', values : []}];
        var svg = d3.select(ele[0])
          .append('svg')
          .style({'width': '100%', 'height': '100%'});

        SliderFactory.getFollowStats()
          .then(function(resp){
            angular.forEach(resp, function (i) {
              if (i.counts) {
                dataset.push({ type: i.media, followers : i.counts.followers });
                dataset.push({ type: i.media, following : i.counts.following });
                dataset2[0].values.push({ x : i.counts.followers, y : i.counts.following });
              }
            });          
          })
          .then(function () {
            nv.addGraph(function() {
              var colorObj = {
                'soundcloud': '#FF5500',
                'twitter': '#54aaec',
                'instagram': '#325C86'
              };
              var chart = nv.models.pieChart()
                  .x(function(d) { return d.followers ? d.type + ' followers' : d.type + ' following'; })
                  .y(function(d) { return d.followers ? d.followers : d.following; })
                  .color(function (d) { return colorObj[d.type]; })
                  .showLegend(true)
                  .showLabels(false)     //Display pie labels
                  .labelThreshold(0.05)  //Configure the minimum slice size for labels to show up
                  .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
                  .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
                  .donutRatio(0.35);     //Configure how big you want the donut hole size to be.

                d3.select("#pie svg")
                    .datum(dataset)
                    .transition().duration(350)
                    .call(chart);
                  

              return chart;
            });
            // nv.addGraph(function() {
            //   var chart = nv.models.multiBarChart();
            //   // chart.xAxis.tickFormat(function(d) {
            //   //     return d3.time.format('%x')(new Date(d));
            //   // });

            //   // chart.yAxis.tickFormat(d3.format(',d'));

            //   d3.select('#pie svg')
            //       .datum(dataset2)
            //       .transition().duration(500).call(chart);

            //   nv.utils.windowResize(chart.update);

            //   return chart;
            // });
          });

        var imgs = svg.selectAll("image").data([0]);
                imgs.enter()
                .append("svg:image")
                .attr("xlink:href", "../static/views/ONE.png")
                .attr("x", "0")
                .attr("y", "0")
                .attr("width", '100%')
                .attr("height", '150');

        scope.render = function(data) {
          svg.selectAll('*').remove();
        };
      }
    };
  }]);

var splunkjs = require('splunk-sdk');
var Async = splunkjs.Async;
var service = new splunkjs.Service({username: "admin", password: "21qazSE$#"});
service.login(function(err, success) {
    if (err) {
        throw err;
    }

    console.log("Login was successful: " + success);
    service.jobs().fetch(function(err, jobs) {
        var jobList = jobs.list();
        for(var i = 0; i < jobList.length; i++) {
            console.log("Job " + i + ": " + jobList[i].sid);
        }
    });
    //service.search('search source="smaccess_20170823_235857.log" host="SiteMinder" sourcetype="SiteMinder" Event="[ValidateAccept" | dedup RealmOid, SessionId | head 3', {}, searchSuccess);

});



var searchQuery = 'search source="smaccess_20170823_235857.log" host="SiteMinder" sourcetype="SiteMinder" Event="[ValidateAccept" | dedup RealmOid, SessionId';

// Set the search parameters
var searchParams = {
  exec_mode: "normal"
};

// Run a normal search that immediately returns the job's SID
service.search(
  searchQuery,
  searchParams,
  function(err, job) {

    // Display the job's search ID
    console.log("Job SID: ", job.sid);

    // Poll the status of the search job
    job.track({period: 200}, {
      done: function(job) {
        console.log("Done!");

        // Print out the statics
        console.log("Job statistics:");
        console.log("  Event count:  " + job.properties().eventCount); 
        console.log("  Result count: " + job.properties().resultCount);
        console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
        console.log("  Priority:     " + job.properties().priority);
/*
        // Get the results and print them
        job.results({}, function(err, results, job) {
          var fields = results.fields;
          var rows = results.rows;
          for(var i = 0; i < rows.length; i++) {
            var values = rows[i];
            console.log("Row " + i + ": ");
            for(var j = 0; j < values.length; j++) {
              var field = fields[j];
              var value = values[j];
              console.log("  " + field + ": " + value);
            }
          }
        });
    */    
      },
      failed: function(job) {
        console.log("Job failed")
      },
      error: function(err) {
        done(err);
      }
    });

  }
);
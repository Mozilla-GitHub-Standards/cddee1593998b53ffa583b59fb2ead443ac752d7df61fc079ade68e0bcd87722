describe("DataService", function() {
  this.dataService;

  beforeEach(function() {
    module("UPDashboard");
    inject(function(dataService) {
      this.dataService = dataService;
    });
  });

  it("_populateData : should populate payload data", function() {
    var data = {
      type: "pageload",
      content: {
        interestsProfile: true,
        interestsHosts: true,
        requestingSites: true,
      }
    }
    spyOn(dataService, "_populateData").andCallThrough();
    dataService._populateData(data);
    expect(dataService._interestsProfile).toBe(true);
    expect(dataService._interestsHosts).toBe(true);
    expect(dataService._requestingSites).toBe(true);
  });

  it("_setSitePermission : should change a given site's permissions", function() {
    spyOn(dataService, "_setSitePermission").andCallThrough();

    // no content
    dataService._requestingSites = [];
    dataService._setSitePermission({site: "example.com", isBlocked: true});
    expect(dataService._requestingSites).toBeIdenticalTo([]);

    // request to change something that doesn't exist
    dataService._requestingSites = [{name: "example.com", isBlocked: false}];
    dataService._setSitePermission({site: "example2.com", isBlocked: true});
    expect(dataService._requestingSites).toBeIdenticalTo([{name: "example.com", isBlocked: false}]);

    // flipping permissions
    dataService._requestingSites = [{name: "example.com", isBlocked: false}, {name: "example2.com", isBlocked: true}];
    dataService._setSitePermission({site: "example.com", isBlocked: true});
    expect(dataService._requestingSites).toBeIdenticalTo([{name: "example.com", isBlocked: true}, {name: "example2.com", isBlocked: true}]);

  });

  it("handleEvent : should handle events sent by the browser", function() {

    function dispatchMessage(data) {
      evt = new Event("message");
      evt.data = data;
      window.dispatchEvent(evt);
    }

    spyOn(dataService, "handleEvent").andCallThrough();
    spyOn(dataService.rootScope, "$broadcast").andCallThrough();

    /** first load **/
    spyOn(dataService, "reqPagePayload");
    expect(dataService._isFirstLoad).toBe(true);
    dispatchMessage({type: "prefs"});
    expect(dataService._isFirstLoad).toBe(false);
    expect(dataService.reqPagePayload).toHaveBeenCalled();

    /** prefs **/
    expect(dataService._prefs.enabled).toBe(false);

    // no change
    dispatchMessage({type: "prefs", content: {enabled: false}});
    expect(dataService.handleEvent).toHaveBeenCalled();
    expect(dataService._prefs.enabled).toBe(false);
    expect(dataService.rootScope.$broadcast).not.toHaveBeenCalledWith("prefChanged");

    // pref change
    dispatchMessage({type: "prefs", content: {enabled: true}});
    expect(dataService.handleEvent).toHaveBeenCalled();
    expect(dataService._prefs.enabled).toBe(true);
    expect(dataService.rootScope.$broadcast).toHaveBeenCalledWith("prefChanged");

    /** pageload **/
    dispatchMessage(UPTestData.payloadSample);
    expect(dataService.handleEvent).toHaveBeenCalled();
    expect(dataService.rootScope.$broadcast).toHaveBeenCalledWith("pageloadReceived");
  });

  it("_sendToBrowser and friends : should send structured data to the browser", function() {
    var eventHandler = jasmine.createSpy("eventHandler");
    window.document.addEventListener("RemoteUserProfileCommand", eventHandler, false);

    var testIndex = 0;
    function testEvent(eventSpy, expectedResult) {
      var evt = eventSpy.argsForCall[testIndex][0];
      expect(eventSpy).toHaveBeenCalled();
      expect(typeof(evt)).toBe("object");
      expect(evt.detail).toBeIdenticalTo(expectedResult);
      testIndex += 1;
    }

    // test the raw _sendToBrowser function
    dataService._sendToBrowser("Joke", "rigmarole");
    testEvent(eventHandler, {command: "Joke", data: "rigmarole"});

    // test wrappers for sentToBrowser
    
    dataService.disableUP();
    testEvent(eventHandler, {command: "DisableUP"});

    dataService.enableUP();
    testEvent(eventHandler, {command: "EnableUP"});

    dataService.reqPrefs();
    testEvent(eventHandler, {command: "RequestCurrentPrefs"});

    dataService.reqPagePayload();
    testEvent(eventHandler, {command: "RequestCurrentPagePayload"});

    dataService.setInterestSharable("coffee", true);
    testEvent(eventHandler, {command: "SetInterestSharable", data: ["coffee", true]});
    dataService.setInterestSharable("meetings", false);
    testEvent(eventHandler, {command: "SetInterestSharable", data: ["meetings", false]});
    dataService.setInterestSharable("meetings");
    testEvent(eventHandler, {command: "SetInterestSharable", data: ["meetings", undefined]});
    dataService.setInterestSharable();
    testEvent(eventHandler, {command: "SetInterestSharable", data: [undefined, undefined]});

    dataService.disableSite();
    testEvent(eventHandler, {command: "DisableSite"});
    dataService.disableSite("example.com");
    testEvent(eventHandler, {command: "DisableSite", data: "example.com"});

    dataService.enableSite();
    testEvent(eventHandler, {command: "EnableSite"});
    dataService.enableSite("example.com");
    testEvent(eventHandler, {command: "EnableSite", data: "example.com"});
  });
});
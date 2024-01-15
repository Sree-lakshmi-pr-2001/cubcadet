/**
 * TDD object
 */
function TDD() {
	var _requests = {}, //Each test in the test suite is represented by a "request" and each running "request" is stored in the "_request" dictionary.  
		_checkRequestInterval = null, //This represents the interval that checks if a test is running and reports the overall status when the tests are done
		_checkingRequests = false, //Boolean that is set to true when a test is kicked off
		_pageHelper = PageHelper(),  //Encapsulates jQuery DOM manipulation for the page
		_tableHelper = TableHelper(), //Encapsulates jQuery DOM manipulation for the table
		_utilsHelper = UtilsHelper(),
		_messageHelper = MessageHelper(),
		_suiteHelper = SuiteHelper();
	
	//This function is executed whenever a test is started and kicks off a "setInterval" to run the "checkRequests" function every 10 ms  
	function startCheckingRequests() {
		if (_checkingRequests) {
			return;
		};
        _pageHelper.resetTotalElapsed();
        _pageHelper.resetTitleColor();
        _pageHelper.showTitleProgressImage();
        _checkRequestInterval = setInterval(checkRequests, 10);
        _checkingRequests = true;
	};
		
	//This function is called whenever a test is cancelled to update the overall status of the test suite	
	function stopCheckingRequests() {
		//if we are not checking requests, or if there are still requests running then return
	    if (!_checkingRequests || requestsAreRunning()) {
	        return;
	    };
		_checkingRequests = false;
        _pageHelper.showClearResultsButton();
        _pageHelper.showRunAllButton();
        clearInterval(_checkRequestInterval);
        updateOverallStatus();
	};
	
	function requestsAreRunning() {
	    var running = false;
	    for (var p in _requests) {
	        if (_requests[p].isRunning()) {
	            running = true;
	            break;
	        };
	    };
	    return running;
	};
	
	//If there are no more requests running then stop checking requests
	function checkRequests() {
	    _pageHelper.hideClearResultsButton();

	    if (!requestsAreRunning()) {
	       stopCheckingRequests();
	    };
	};
	
	function updateOverallStatus() {
	    var totalElapsedTime = 0,
	        passed = true,
			request = null;

	    for (var p in _requests) {
			request = _requests[p];
	        totalElapsedTime += request.elapsedTime();
	        if (passed && !request.passed()) {
	            passed = false;
	        };
	    };

		_requests = {};
	    _pageHelper.setTotalElapsed(totalElapsedTime);
	    _pageHelper.setTitleStatusColor(passed);
	    _pageHelper.hideTitleProgressImage();
	};
	
	function clearResults() {
	    for (var p in _requests) {
	        _requests[p].stop();
	    };

	    _tableHelper.reset();
	    _pageHelper.resetTotalElapsed();
	    _pageHelper.resetTitleColor();
	};
	
	//This function represents a running test request
	function RequestBuilder(index) {
	    var _isRunning = false,
	        _requestTimer = null,
	        _elapsed = 0,
	        _passed = false,
	        _jqXHR = null;

	    function makeAjaxRequest(action, suite) {
	        _jqXHR = $.getJSON(action, {
	            "suite": suite,	            
	            "testid": index
	        }).success(function (data, textStatus, _jqXHR) {
	            _isRunning = false;
	            _elapsed = parseInt(data.tests[0].elapsed);
	            _passed = data.tests[0].passed;
	            _skipped = data.tests[0].skipped;
	            displayRowSuccess(_elapsed, _passed, _skipped, data.tests[0].exception, data.scriptlog);
	        }).error(function (_jqXHR, textStatus, errorThrown) {
	            _isRunning = false;
	            _elapsed = 0;
	            _passed = false;
	            displayRowError(errorThrown);
	        });
	    };

	    function displayRowError(errorThrown) {
	    	_tableHelper.resetRow(index);
	        _tableHelper.displayError(index, errorThrown);
	        _tableHelper.clearElapsed(index);
	        _tableHelper.showStartButton(index);
	    };

	    function displayRowSuccess(elapsed, passed, skipped, exception, scriptlog) {
	    	_tableHelper.resetRow(index);
	    	_tableHelper.displayElapsed(index, elapsed);
	        _tableHelper.displayResult(index, passed, skipped);
	        
	        if (!passed && !skipped) {
	            _tableHelper.displayException(index, exception.message);
	        } else {
	            _tableHelper.clearException(index);
	        };

	        if (scriptlog && !skipped) {
	            _tableHelper.displayScriptLog(index, scriptlog);
	        } else {
	            _tableHelper.clearScriptLog(index);
	        };

	        _tableHelper.hideProgressImage(index);
	        _tableHelper.showStartButton(index);
	    };

	    function displayRowReadyToRun() {
	        _tableHelper.hideProgressImage(index);
	        _tableHelper.showStartButton(index);
	    };

	    function displayRowRunning() {
	        _tableHelper.clearElapsed(index);
	        _tableHelper.clearResult(index);
	        _tableHelper.showProgressImage(index);
	        _tableHelper.showCancelButton(index);
	    };

	    return {
	        "start": function (action, suite) {
	            if (!_isRunning) {
	                _isRunning = true;
	                displayRowRunning();
	                _requestTimer = setTimeout(function() {
	                		makeAjaxRequest(action, suite); 
                	}, 10);
	            }
	        },
	        "stop": function () {
	            if (_isRunning) {
	                _isRunning = false;
	                displayRowReadyToRun();
	                _jqXHR && _jqXHR.abort();
	                clearTimeout(_requestTimer);
	            };
	        },
	        "isRunning": function () {
	            return _isRunning;
	        },
	        "elapsedTime": function () {
	            return _elapsed;
	        },
	        "passed": function () {
	            return _passed
	        }
	    };
	};

	function TableHelper() {
	    var START_STOP_INDEX = 1,
	        TEST_NAME_INDEX = 3,
	        ELAPSED_INDEX = 4,
	        PROGRESS_INDEX = 4,
	        ERROR_INDEX = 5,
	        RESULT_INDEX = 5,
	        _rows = $("#testTable tbody").children();

	    function getCell(rowIndex, colIndex) {
	        var row = _rows[rowIndex],
	            cells = $(row).children();
	        return $(cells[colIndex]);
	    };

	    return {
	        "displayError": function (index, errorThrown) {
	            getCell(index, ERROR_INDEX).find("span").text(errorThrown).css("color", "red");
	        },
	        "displayException": function (index, exceptionMessage) {
	            var errorMessageDiv = getCell(index, TEST_NAME_INDEX).find("div.errorMessageDiv"),
	                errorMessagePre = errorMessageDiv.find("pre");

	            errorMessagePre.text(exceptionMessage);
	            errorMessageDiv.show();
	        },
	        "clearException": function (index) {
	            var errorMessageDiv = getCell(index, TEST_NAME_INDEX).find("div.errorMessageDiv"),
	                errorMessagePre = errorMessageDiv.find("pre");

	            errorMessagePre.text("");
	            errorMessageDiv.hide();
	        },
	        "displaySkip": function (index) {
	        	this.clearException(index);
	        },
	        "displayScriptLog": function (index, scriptlog) {
	            var scriptLogDiv = getCell(index, TEST_NAME_INDEX).find("div.scriptLogDiv"),
	                scriptLogPre = scriptLogDiv.find("pre");

	            scriptLogPre.text(scriptlog);
	            scriptLogDiv.show();
	        },
	        "clearScriptLog": function (index, scriptlog) {
	            var scriptLogDiv = getCell(index, TEST_NAME_INDEX).find("div.scriptLogDiv"),
	                scriptLogPre = scriptLogDiv.find("pre");

	            scriptLogPre.text("");
	            scriptLogDiv.hide();
	        },
	        "displayElapsed": function (index, elapsed) {
	            getCell(index, ELAPSED_INDEX).find("span.text").text(elapsed);
	        },
	        "clearElapsed": function (index) {
	            getCell(index, ELAPSED_INDEX).find("span.text").html("&nbsp;");
	        },
	        "displayResult": function (index, passed, skipped) {
	            getCell(index, RESULT_INDEX).find("span").text(passed ? "Passed" : (skipped ? "Skipped" : "Failed")).css("color", passed ? "green" : (skipped ? "blue" : "red"));
	            getCell(index, RESULT_INDEX).parent().addClass(passed ? "success" : (skipped ? "info" : "danger"));
	        },
	        "clearResult": function (index) {
	            getCell(index, RESULT_INDEX).find("span").html("&nbsp;");
	        },
	        "showCancelButton": function (index) {
	            var cell = getCell(index, START_STOP_INDEX);

	            cell.find(".stopImage").removeClass('hide');
	            cell.find(".startImage").hide();
	        },
	        "showStartButton": function (index) {
	            var cell = getCell(index, START_STOP_INDEX);

	            cell.find(".stopImage").addClass('hide');
	            cell.find(".startImage").show();
	        },
	        "showProgressImage": function (index) {
	            getCell(index, PROGRESS_INDEX).find("span:eq(0)").removeClass('hide');
	        },
	        "hideProgressImage": function (index) {
	            getCell(index, PROGRESS_INDEX).find("span:eq(0)").addClass('hide');
	        },
	        "reset": function () {
	            _rows.each(function (index) {
	                getCell(index, ELAPSED_INDEX).find("span").html("&nbsp;");
	                getCell(index, RESULT_INDEX).find("span").html("&nbsp;").css("color", "");
	                getCell(index, RESULT_INDEX).parent().removeClass('success info danger');
	            });
				this.hideScriptLog();
		    	this.hideErrorMessage();

	        },
	        "resetRow": function (index) {
	        	getCell(index, ELAPSED_INDEX).find("span").html("&nbsp;");
                getCell(index, RESULT_INDEX).find("span").html("&nbsp;").css("color", "");
                getCell(index, RESULT_INDEX).parent().removeClass('success info danger');
	        },
	        "hideScriptLog": function () {
	            $("div.scriptLogDiv").hide();
	            $("div.scriptLogDiv > pre").hide();
	        },
	        "hideErrorMessage": function () {
	            $("div.errorMessageDiv").hide();
	            $("div.errorMessageDiv > pre").hide();
	        }
	    };
	};

	function PageHelper() {
	    var _titleLoader = $("#titleLoader"),
	        _totalElapsed = $("#totalElapsed"),
	        _title = $("div.title"),
	        _clearResults = $("#clearResults"),
	        _cancelAllTests = $("#cancelAllTests"),
	        _runAllTests = $("#runAllTests");

	    return {
	        "showTitleProgressImage": function () {
	        	_titleLoader.removeClass('hide');
	        },
	        "hideTitleProgressImage": function () {
	            //_titleLoader.hide();
	            _titleLoader.addClass('hide');
	        },
	        "setTotalElapsed": function (elapsed) {
	            _totalElapsed.text("(" + elapsed + " ms)");
	        },
	        "resetTotalElapsed": function () {
	            _totalElapsed.text("");
	        },
	        "setTitleStatusColor": function (passed) {
	            _title.css("color", passed ? "green" : "red");
	        },
	        "resetTitleColor": function () {
	            _title.css("color", "");
	        },
	        "showClearResultsButton": function () {
	            _clearResults.show();
	        },
	        "hideClearResultsButton": function () {
	            _clearResults.hide();
	        },
	        "showRunAllButton": function () {
	            _cancelAllTests.addClass('hide');
	            _runAllTests.show();
	        },
	        "showCancelAllButton": function () {
	            _runAllTests.hide();
	            _cancelAllTests.removeClass('hide');
	        }
	    };
	};
	
	function UtilsHelper() {

		function format() {

			if (!arguments.length) {
				return;
			}
			
			var _finalString = arguments[0];
			
			for (var i = 1; i < arguments.length; i++) {
				_finalString = _finalString.replace(new RegExp('\\{' + (i - 1) + '\\}', 'g'), arguments[i]);
			}
			return _finalString;
		};
		
		return {
			'format' : format
		};
	};

	function MessageHelper() {
		var _errorModel = '<div class="alert alert-danger alert-dismissible" role="alert">' +
						'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
						'<strong>Error!</strong> {0}</div>';
		
		function showError(data, elem) {

			var _errorHtml = _utilsHelper.format(_errorModel, data.error);

			$(_errorHtml).insertBefore(elem);

			window.setTimeout(function() {
				$('.alert-danger').fadeTo(500, 0).slideUp(500, function(){
					$(this).remove(); 
				});
			}, 5000);
		};
		
		return {
			'showError': showError
		};
	};

	function SuiteHelper() {

		var _rowModel = '<tr>' +
							'<td><a href="Tester-DisplaySuite?suite={0}">{0}</a></td>' +
							'<td>{1}</td>' +
							'<td>{2}</td>' +
							'<td><button type="button" class="btn btn-default" data-toggle="collapse" data-target="#details{3}">info</button></td>' +
						'</tr>' +
						'<tr class="collapse out row-disable-hover" id="details{3}">' +
							'<td colspan="3">' +
							'<div class="panel panel-info panel-default">' +
							'<div class="panel-heading">Description:</div>' +
							'<div class="panel-body">{4}</div></div></td>' +
						'</tr>';

		function makeRequest(action, data, successCallback, errorCallback) {
			_jqXHR = $.getJSON(action, data.serialize())
			.done(function (data, textStatus, _jqXHR) {
				if (data.error) {
					errorCallback(data, 'form');
				} else {
					successCallback(data);
					clearForm();
				}
			})
			.fail(function (_jqXHR, textStatus, error) {
				
			});
		};

		function addRowEntry(data) {
			if (data == null) {
				return;
			}

			var _suitesTable = $('table'),
				_rowIndex = _suitesTable.find('tbody tr').length / 2 + 1,
				_entryHtml = _utilsHelper.format(_rowModel, data.name, data.displayName, data.modulePath, _rowIndex, data.description);
			
			$("tr.in").removeClass("in");
			
			if(_suitesTable.find('tbody tr:last').length) {
				$(_entryHtml).insertAfter(_suitesTable.find('tbody tr:last'));
			} else {
				$(_suitesTable.find('tbody')).append(_entryHtml);
			}
		};

		function fillFormData(data) {
			$('form input, form textarea').each( function(index, elem) {
				$(elem).val(data[index]);
			});
		};

		function clearForm() {
			var _form = $('form');
			_form[0].reset();
			_form.removeClass();
			_form.find('#actionType').val('');
			$('#formContainer').addClass('hide');
		};

		/**
		 * find correct row + replace data
		 */
		function editRowEntry(data) {

			if (data == null) {
				return;
			}

			var _suitesTable = $('table'),
				_selectedRow = _suitesTable.find('tr.highlight:not(.row-disable-hover)'),
				_rowIndex = Math.floor(_selectedRow.prevAll().length / 2),
				_entryHtml = _utilsHelper.format(_rowModel, data.name, data.displayName, data.modulePath, _rowIndex, data.description);

			$(_entryHtml).insertAfter(_selectedRow);
			_selectedRow.removeClass('highlight');
			_selectedRow.remove().next().remove();			
		};

		function removeRowEntry(data) {

			if (data == null) {
				return;
			}

			var _suitesTable = $('table'),
				_selectedRow = _suitesTable.find('tr.highlight:not(.row-disable-hover)');

			_selectedRow.remove().next().remove();
		};

		return {
			'add': function(obj) {
				makeRequest('Tester-SuiteAction', obj, addRowEntry, _messageHelper.showError);
			},
			'edit': function(obj) {
				makeRequest('Tester-SuiteAction', obj, editRowEntry, _messageHelper.showError);
			},
			'remove': function(obj) {
				makeRequest('Tester-SuiteAction', obj, removeRowEntry, _messageHelper.showError);
			},
			'fillFormData': fillFormData,
			'clearForm': clearForm
		};
	};

	return {
		"init": function () {
			//set infinite timeout in jQuery
			$.ajaxSetup({
			    "timeout": 0
			});
			
			//setup click event for individual test
			$("#testTable tbody").on("click", "td.runTest", function (e) {
		        var currentRow = $(this).parent(),
		            index = currentRow.find("td:first-child").text(),
		            request = _requests[index];
		        	suite = currentRow.parent().parent().attr('data-meta-suite');		        	
				//if the test is already running then cancel it	
		        if (request && request.isRunning()) {
		            request.stop();
		            stopCheckingRequests();
		        } else {
					//create a new request and start it
		            request = RequestBuilder(index); 
		            _requests[index] = request;
		            request.start('Tester-Run', suite);
		            startCheckingRequests();
		        };
				e.preventDefault();
		    });
			
			//setup the click event that runs all tests
			$("#runAllTests").on("click", function (e) {
		        _pageHelper.showCancelAllButton();

		        for (var p in _requests) {
		            _requests[p].stop();
		        };

		        _requests = {};

		        $("td.runTest").trigger("click");
				e.preventDefault();
		    });
			
			//setup the click event to cancel all running tests	
		    $("#cancelAllTests").on("click", function (e) {
		        _pageHelper.showRunAllButton();

		        for (var p in _requests) {
		            _requests[p].stop();
		        };
				e.preventDefault();
		    });

		    $("#clearResults").on("click", function (e) {
		        clearResults();
				e.preventDefault();
		    });
		    
			//this event handles the visibility of the "exception" and "scriptlog" links that may appear when a test completes 	
		    $("#testTable tbody").on("click", "a", function (e) {
		        $(this).parent().find("pre").toggle();
		        e.preventDefault();
		    });

		    // Suites table actions
		    $('body').on('submit', '#suiteForm.suite-add', function (e) {
			    	_suiteHelper.add($(this));
			    	return false;
		    });

		    $('body').on('submit', '#suiteForm.suite-edit', function (e) {
			    	_suiteHelper.edit($(this));
			    	return false;
		    });

		    $('body').on('submit', '#suiteForm.suite-remove', function (e) {
			    	_suiteHelper.remove($(this));
			    	return false;
		    });

		    $('#addSuite').on('click', function() {
			    	var _container = $('#formContainer'),
			    		_form = _container.find('form');
			    	
			    	_container.find('.title').text('Add new test suite');
	
			    	_form.removeClass().addClass('suite-add');
			    	_form.find('#actionType').val('PUT');
			    	_container.removeClass('hide');
			    	$("tr.in").removeClass("in");
		    });

		    $('#editSuite').on('click', function() {
			    	var _container = $('#formContainer'),
			    		_tableRow = $('table tr.highlight');
	
			    	_container.find('.title').text('Edit test suite');
	
			    	if (_tableRow.length) {
			    		var _formData = new Array(),
			    			_form = _container.find('form');
	
			    		_tableRow.find('td:eq(0) a, td:eq(1), td:eq(2), td:eq(0) .panel-body').each( function(index, td) {
			    			_formData.push($(td).text().trim());
			    		});
	
			    		_suiteHelper.fillFormData(_formData);
	
			    		_form.removeClass().addClass('suite-edit');
			    		_form.find('#actionType').val('UPDATE');
			    		_form.find('#oldName').val(_formData[0]);
			    		_container.removeClass('hide');
			    		
			    		$("tr.in").removeClass("in");
			    	} else {
			    		if(!_container.hasClass('hide')) {
			    			_container.addClass('hide');
			    		}
			    		_messageHelper.showError({error: 'You did not select any suite!'}, 'table');
			    	}
			});
	
		    $('#removeSuite').on('click', function() {
			    	var _container = $('#formContainer'),
		    		_tableRow = $('table tr.highlight');
	
			    	if (_tableRow.length) {
			    		var _formData = new Array(),
		    				_form = _container.find('form');
	
			    		_tableRow.find('td:eq(0) a, td:eq(1), td:eq(0) .panel-body').each( function(index, td) {
			    			_formData.push($(td).text().trim());
			    		});
	
			    		_suiteHelper.fillFormData(_formData);
	
			    		_form.removeClass().addClass('suite-remove');
			    		_form.find('#actionType').val('DELETE');
			    		_form.find('#oldName').val(_formData[0]);
	
			    		if(!_container.hasClass('hide')) {
			    			_container.addClass('hide');
			    		}
			    		
			    		$("tr.in").removeClass("in");
			    			
			    		$('#suiteForm.suite-remove').trigger('submit');
			    	} else {
			    		_messageHelper.showError({error: 'You did not select any suite!'}, 'table');
			    	}
		    });

		    // General table actions
		    $('table#testSuitesTable').on('click', 'tr:not(.row-disable-hover)', function(e) {
			    	var _container = $('#formContainer');
	
			    	$('table').find('tr.highlight').removeClass('highlight');
			    	$(this).addClass('highlight').next().addClass('highlight');
			    	_container.addClass('hide');
			    	_suiteHelper.clearForm();
	    		});
		}
	};
};

/*
 * 	Initialization of functions
 *
*/

$(window).load(function () {
	TDD().init();
});

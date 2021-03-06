/* jshint -W117, -W030 */
/*global bard $controller $httpBackend should assert upgradeFactory $q upgradeStatusFactory
UPGRADE_STEPS NODES_UPGRADE_TIMEOUT_INTERVAL sinon $rootScope*/
describe('Upgrade Nodes Controller', function() {
    var controller,
        stepStatus = {
            pending: 'pending',
            running: 'running',
            passed: 'passed',
        },
        totalNodes = 125,
        upgradedNodes = 50,
        initialStatusResponseData = {
            current_step: 'nodes_upgrade',
            substep: null,
            current_node: {
                alias: 'controller-1',
                name: 'controller.1234.suse.com',
                ip: '1.2.3.4',
                role: 'controller',
                state: 'pre-upgrade'
            },
            remaining_nodes: totalNodes,
            upgraded_nodes: 0,
            steps: {
                upgrade_prechecks: {
                    status: stepStatus.passed,
                    errors: {}
                },
                upgrade_prepare: {
                    status: stepStatus.passed,
                    errors: {}
                },
                admin_backup: {
                    status: stepStatus.passed,
                    errors: {}
                },
                admin_repo_checks: {
                    status: stepStatus.passed,
                    errors: {}
                },
                admin_upgrade: {
                    status: stepStatus.passed,
                    errors: {}
                },
                database: {
                    status: stepStatus.passed,
                    errors: {}
                },
                nodes_repo_checks: {
                    status: stepStatus.passed,
                    errors: {}
                },
                nodes_services: {
                    status: stepStatus.passed,
                    errors: {}
                },
                nodes_db_dump: {
                    status: stepStatus.passed,
                    errors: {}
                },
                nodes_upgrade: {
                    status: stepStatus.pending,
                    errors: {}
                },
                finished: {
                    status: stepStatus.pending,
                    errors: {}
                }
            }
        },
        initialStatusResponse = {
            data: initialStatusResponseData
        },
        failingErrors = {
            error_message: 'Authentication failure'
        },
        errorStatusResponse = {
            data:  { errors: failingErrors }
        },
        completedUpgradeData = _.merge(
            {},
            initialStatusResponseData,
            {
                current_step: 'finished',
                current_node: {
                    alias: 'compute-1234',
                    name: 'compute.1234.suse.com',
                    ip: '123.2.3.4',
                    role: 'compute',
                    state: 'finished'
                },
                remaining_nodes: 0,
                upgraded_nodes: totalNodes,
                steps: {
                    nodes_upgrade: {
                        status: stepStatus.passed
                    },
                    finished: {
                        status: stepStatus.pending
                    }
                }

            }
        ),
        completedUpgradeResponse = {
            data: completedUpgradeData
        },
        runningUpgradeData = _.merge(
            {},
            initialStatusResponseData,
            {
                current_node: {
                    alias: 'compute-345',
                    name: 'compute.345.suse.com',
                    ip: '34.2.3.4',
                    role: 'compute',
                    state: 'migrating VMs'
                },
                remaining_nodes: totalNodes - upgradedNodes,
                upgraded_nodes:  upgradedNodes,
                steps: {
                    nodes_upgrade: {
                        status: stepStatus.running
                    }
                }
            }
        ),
        runningUpgradeResponse = {
            data: runningUpgradeData
        };

    beforeEach(function() {
        //Setup the module and dependencies to be used.
        bard.appModule('crowbarApp.upgrade');
        bard.inject(
            '$controller',
            '$rootScope',
            'upgradeFactory',
            '$q',
            '$httpBackend',
            'upgradeStatusFactory',
            'UPGRADE_STEPS',
            'NODES_UPGRADE_TIMEOUT_INTERVAL'
        );

        //Mock requests that are expected to be made
        $httpBackend.expectGET('app/features/upgrade/i18n/en.json').respond({});
    });

    describe('On initial getStatus success', function () {
        beforeEach(function () {

            bard.mockService(upgradeFactory, {
                getStatus: $q.when(initialStatusResponse)
            });
            spyOn(upgradeStatusFactory, 'waitForStepToEnd');

            controller = $controller('UpgradeNodesController');

            $httpBackend.flush();
        });

        // Verify no unexpected http call has been made
        bard.verifyNoOutstandingHttpRequests();

        it('should exist', function() {
            should.exist(controller);
        });

        describe('On activation', function () {
            it('should get the upgrade status', function () {
                assert(upgradeFactory.getStatus.calledOnce);
            });

            it('should not call WaitForStepToEnd', function () {
                expect(upgradeStatusFactory.waitForStepToEnd).not.toHaveBeenCalled();
            });

            it('should update the current node\'s alias', function () {
                expect(controller.nodesUpgrade.currentNode.name)
                    .toEqual(initialStatusResponseData.current_node.alias);
            });

            it('should update the current node\'s role', function () {
                expect(controller.nodesUpgrade.currentNode.role)
                    .toEqual(initialStatusResponseData.current_node.role);
            });

            it('should update the current node\'s state', function () {
                expect(controller.nodesUpgrade.currentNode.state)
                    .toEqual(initialStatusResponseData.current_node.state);
            });

            it('should update upgraded nodes count', function () {
                expect(controller.nodesUpgrade.upgradedNodes)
                    .toEqual(initialStatusResponseData.upgraded_nodes);
            });

            it('should update total nodes', function () {
                expect(controller.nodesUpgrade.totalNodes)
                    .toEqual(initialStatusResponseData.upgraded_nodes +
                        initialStatusResponseData.remaining_nodes);
            });

            it('should not be completed', function () {
                assert.isFalse(controller.nodesUpgrade.completed);
            });

            it('should not be running', function () {
                assert.isFalse(controller.nodesUpgrade.running);
            });

            it('should not have spinner visible', function () {
                assert.isFalse(controller.nodesUpgrade.spinnerVisible);
            });
        });
    });

    describe('On running getStatus success', function () {
        beforeEach(function () {

            bard.mockService(upgradeFactory, {
                getStatus: $q.when(runningUpgradeResponse),
            });
            spyOn(upgradeStatusFactory, 'waitForStepToEnd');

            controller = $controller('UpgradeNodesController');

            $httpBackend.flush();
        });

        // Verify no unexpected http call has been made
        bard.verifyNoOutstandingHttpRequests();

        it('should exist', function() {
            should.exist(controller);
        });

        describe('On activation', function () {
            it('should get the upgrade status', function () {
                assert(upgradeFactory.getStatus.calledOnce);
            });

            it('should call WaitForStepToEnd', function () {
                expect(upgradeStatusFactory.waitForStepToEnd).toHaveBeenCalledTimes(1);
                expect(upgradeStatusFactory.waitForStepToEnd).toHaveBeenCalledWith(
                    UPGRADE_STEPS.nodes_upgrade,
                    NODES_UPGRADE_TIMEOUT_INTERVAL,
                    jasmine.any(Function),
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
            });

            it('should not be completed', function () {
                assert.isFalse(controller.nodesUpgrade.completed);
            });

            it('should be running', function () {
                assert.isTrue(controller.nodesUpgrade.running);
            });

            // @TODO: Should not call onSucces with a given Running response
            describe('when onSuccess callback is executed', function () {
                beforeEach(function () {
                    upgradeStatusFactory.waitForStepToEnd.calls.argsFor(0)[2](runningUpgradeResponse);
                });

                it('should update the current node\'s alias', function () {
                    expect(controller.nodesUpgrade.currentNode.name)
                        .toEqual(runningUpgradeData.current_node.alias);
                });

                it('should update the current node\'s role', function () {
                    expect(controller.nodesUpgrade.currentNode.role)
                        .toEqual(runningUpgradeData.current_node.role);
                });

                it('should update the current node\'s state', function () {
                    expect(controller.nodesUpgrade.currentNode.state)
                        .toEqual(runningUpgradeData.current_node.state);
                });

                it('should update upgraded nodes count', function () {
                    expect(controller.nodesUpgrade.upgradedNodes)
                        .toEqual(runningUpgradeData.upgraded_nodes);
                });

                it('should update total nodes', function () {
                    expect(controller.nodesUpgrade.totalNodes)
                        .toEqual(runningUpgradeData.upgraded_nodes +
                            runningUpgradeData.remaining_nodes);
                });
            });

            describe('when onError callback is executed', function () {
                beforeEach(function () {
                    upgradeStatusFactory.waitForStepToEnd.calls.argsFor(0)[3](errorStatusResponse);
                });
                it('should not be running', function () {
                    assert.isFalse(controller.nodesUpgrade.running);
                });

                it('should expose the errors to the view model', function () {
                    expect(controller.nodesUpgrade.errors).toEqual(errorStatusResponse.data.errors);
                });
            });

            describe('when onRunning callback is executed', function () {
                beforeEach(function () {
                    upgradeStatusFactory.waitForStepToEnd.calls.argsFor(0)[4](runningUpgradeResponse);
                });

                it('should update the current node\'s alias', function () {
                    expect(controller.nodesUpgrade.currentNode.name)
                        .toEqual(runningUpgradeData.current_node.alias);
                });

                it('should update the current node\'s role', function () {
                    expect(controller.nodesUpgrade.currentNode.role)
                        .toEqual(runningUpgradeData.current_node.role);
                });

                it('should update the current node\'s state', function () {
                    expect(controller.nodesUpgrade.currentNode.state)
                        .toEqual(runningUpgradeData.current_node.state);
                });

                it('should update upgraded nodes count', function () {
                    expect(controller.nodesUpgrade.upgradedNodes)
                        .toEqual(runningUpgradeData.upgraded_nodes);
                });

                it('should update total nodes', function () {
                    expect(controller.nodesUpgrade.totalNodes)
                        .toEqual(runningUpgradeData.upgraded_nodes +
                            runningUpgradeData.remaining_nodes);
                });
            });
        });
    });

    describe('On initial getStatus error', function () {
        beforeEach(function () {

            bard.mockService(upgradeFactory, {
                getStatus: $q.reject(errorStatusResponse),
            });

            controller = $controller('UpgradeNodesController');

            $httpBackend.flush();
        });

        // Verify no unexpected http call has been made
        bard.verifyNoOutstandingHttpRequests();

        it('should exist', function() {
            should.exist(controller);
        });

        describe('On activation', function () {
            it('should get the upgrade status', function () {
                assert(upgradeFactory.getStatus.calledOnce);
            });
            it('should stop running', function () {
                assert.isFalse(controller.nodesUpgrade.running);
            });
            it('should expose the errors to the view model', function () {
                expect(controller.nodesUpgrade.errors).toEqual(failingErrors);
            });
        });
    });


    describe('When Begin Nodes Upgrade is triggered', function () {

        beforeEach(function () {

            bard.mockService(upgradeFactory, {
                getStatus: $q.when(initialStatusResponse),
                upgradeNodes: $q.when()
            });

            controller = $controller('UpgradeNodesController');

            $httpBackend.flush();
        });

        describe('On Upgrade Nodes Success', function () {
            beforeEach(function () {
                spyOn(upgradeStatusFactory, 'waitForStepToEnd');
                // getStatus call needs to be overridden with a upgrade running response
                upgradeFactory.getStatus = sinon.stub().returns(runningUpgradeResponse);

                controller.nodesUpgrade.beginUpgradeNodes();
                $rootScope.$digest();
            });

            it('upgradeNodes should have been called once', function () {
                assert(upgradeFactory.upgradeNodes.calledOnce);
            });

            describe('when waitForStepToEnd is called', function () {

                it('should be running', function () {
                    assert.isTrue(controller.nodesUpgrade.running);
                });
                it('should not be completed', function () {
                    assert.isFalse(controller.nodesUpgrade.completed);
                });

                it('should wait for nodesUpgrade to end', function () {
                    expect(upgradeStatusFactory.waitForStepToEnd).toHaveBeenCalledTimes(1);
                    expect(upgradeStatusFactory.waitForStepToEnd).toHaveBeenCalledWith(
                        UPGRADE_STEPS.nodes_upgrade,
                        NODES_UPGRADE_TIMEOUT_INTERVAL,
                        jasmine.any(Function),
                        jasmine.any(Function),
                        jasmine.any(Function)
                    );
                });

                describe ('when onSuccess is executed', function () {
                    beforeEach(function () {
                        upgradeStatusFactory.waitForStepToEnd.calls.argsFor(0)[2](completedUpgradeResponse);
                    });

                    it('should not be running', function () {
                        assert.isFalse(controller.nodesUpgrade.running);
                    });

                    it('should be completed', function () {
                        assert.isTrue(controller.nodesUpgrade.completed);
                    });

                    it('should update the current node\'s alias', function () {
                        expect(controller.nodesUpgrade.currentNode.name)
                            .toEqual(completedUpgradeData.current_node.alias);
                    });

                    it('should update the current node\'s role', function () {
                        expect(controller.nodesUpgrade.currentNode.role)
                            .toEqual(completedUpgradeData.current_node.role);
                    });

                    it('should update the current node\'s state', function () {
                        expect(controller.nodesUpgrade.currentNode.state)
                            .toEqual(completedUpgradeData.current_node.state);
                    });

                    it('should update upgraded nodes count', function () {
                        expect(controller.nodesUpgrade.upgradedNodes)
                            .toEqual(completedUpgradeData.upgraded_nodes);
                    });

                    it('should update total nodes', function () {
                        expect(controller.nodesUpgrade.totalNodes)
                            .toEqual(completedUpgradeData.upgraded_nodes +
                                completedUpgradeData.remaining_nodes);
                    });

                });

                describe ('when onError is executed', function () {
                    beforeEach(function () {
                        upgradeStatusFactory.waitForStepToEnd.calls.argsFor(0)[3](errorStatusResponse);
                    });

                    it('should not be running', function () {
                        assert.isFalse(controller.nodesUpgrade.running);
                    });

                    it('should not be completed', function () {
                        assert.isFalse(controller.nodesUpgrade.completed);
                    });

                    it('should expose the errors to the view model', function () {
                        expect(controller.nodesUpgrade.errors).toEqual(errorStatusResponse.data.errors);
                    });

                });

                describe ('when onRunning is executed', function () {
                    beforeEach(function () {
                        // Run onRunning callback
                        upgradeStatusFactory.waitForStepToEnd.calls.argsFor(0)[4](runningUpgradeResponse);
                    });

                    it('should be running', function () {
                        assert.isTrue(controller.nodesUpgrade.running);
                    });

                    it('should not be completed', function () {
                        assert.isFalse(controller.nodesUpgrade.completed);
                    });

                    it('should update the current node\'s alias', function () {
                        expect(controller.nodesUpgrade.currentNode.name)
                            .toEqual(runningUpgradeData.current_node.alias);
                    });

                    it('should update the current node\'s role', function () {
                        expect(controller.nodesUpgrade.currentNode.role)
                            .toEqual(runningUpgradeData.current_node.role);
                    });

                    it('should update the current node\'s state', function () {
                        expect(controller.nodesUpgrade.currentNode.state)
                            .toEqual(runningUpgradeData.current_node.state);
                    });

                    it('should update upgraded nodes count', function () {
                        expect(controller.nodesUpgrade.upgradedNodes)
                            .toEqual(runningUpgradeData.upgraded_nodes);
                    });

                    it('should update total nodes', function () {
                        expect(controller.nodesUpgrade.totalNodes)
                            .toEqual(runningUpgradeData.upgraded_nodes +
                                runningUpgradeData.remaining_nodes);
                    });

                });
            });
        });

        describe('On Upgrade Nodes Error', function () {
            beforeEach(function () {
                // Override upgradeNodes behaviod
                upgradeFactory.upgradeNodes = sinon.stub().returns($q.reject(errorStatusResponse));

                controller.nodesUpgrade.beginUpgradeNodes();
                $rootScope.$digest();
            });


            it('should not be running', function () {
                assert.isFalse(controller.nodesUpgrade.running);
            });

            it('should not be completed', function () {
                assert.isFalse(controller.nodesUpgrade.completed);
            });

            it('should expose the errors to the view model', function () {
                expect(controller.nodesUpgrade.errors).toEqual(errorStatusResponse.data.errors);
            });
        });
    });

    describe('On running upgrade nodes operation', function () {
        it('should disable the Upgrade Nodes button');
        it('should display the previous status');
        it('should poll the update status until the process is completed');
    });
});

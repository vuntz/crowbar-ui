(function() {
    'use strict';

    /**
    * @ngdoc function
    * @name crowbarApp.upgrade.controller:UpgradeOpenStackServicesController
    * @description
    * # UpgradeOpenStackServicesController
    * This is the controller used on the Stop OpenStack Services page
    */
    angular.module('crowbarApp.upgrade')
        .controller('UpgradeOpenStackServicesController', UpgradeOpenStackServicesController);

    UpgradeOpenStackServicesController.$inject = [
        '$translate',
        'openstackFactory',
        'upgradeFactory',
        'upgradeStepsFactory'
    ];
    // @ngInject
    function UpgradeOpenStackServicesController($translate, openstackFactory, upgradeFactory, upgradeStepsFactory) {
        var vm = this;

        vm.openStackServices = {
            valid: false,
            completed: false,
            running: false,
            spinnerVisible: false,
            checks: {
                services: {
                    status: false,
                    label: 'upgrade.steps.openstack-services.codes.services'
                },
                backup: {
                    status: false,
                    label: 'upgrade.steps.openstack-services.codes.backup'
                }
            },
            stopServices: stopServices
        };

        /**
         *  Validate OpenStackServices required for Cloud 7 Upgrade
         */
        function stopServices() {
            vm.openStackServices.running = true;

            upgradeFactory.stopServices()
                .then(
                    //Success handler. Stop all OpenStackServices successfully:
                    stopServicesSuccess,
                    //Failure handler:
                    stopServicesError
                );

            function stopServicesSuccess () {
                vm.openStackServices.checks.services.status =
                    vm.openStackServices.valid = true;

                openstackFactory.createBackup()
                    .then(
                        //Success handler. Backup OpenStackServices successfully:
                        createBackupSuccess,
                        //Failure handler:
                        createBackupError
                    ).finally(function() {
                        vm.openStackServices.completed = true;
                        // Update openStackServices validity
                        vm.openStackServices.running = false;

                        vm.openStackServices.valid = vm.openStackServices.checks.backup.status;
                        // if the backup has finished set the step to complete
                        if (vm.openStackServices.valid) {
                            upgradeStepsFactory.setCurrentStepCompleted()
                        }
                    });
            }

            function stopServicesError (errorOpenStackServicesResponse) {
                vm.openStackServices.completed = true;
                vm.openStackServices.running = false;
                // Expose the error list to openStackServices object
                vm.openStackServices.errors = errorOpenStackServicesResponse.data.errors;
            }

            function createBackupSuccess (openStackBackupResponse) {
                vm.openStackServices.checks.backup.status = openStackBackupResponse.data.backup;
            }

            function createBackupError (errorOpenStackServicesResponse) {
                // Expose the error list to openStackServices object
                vm.openStackServices.errors = errorOpenStackServicesResponse.data.errors;
            }
        }
    }
})();

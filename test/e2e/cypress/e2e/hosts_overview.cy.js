import {
  availableHosts,
  agents,
} from '../fixtures/hosts-overview/available_hosts';

const availableHosts1stPage = availableHosts.slice(0, 10);

context('Hosts Overview', () => {
  before(() => {
    cy.visit('/hosts');
    cy.url().should('include', '/hosts');
  });

  describe('Registered Hosts are shown in the list', () => {
    it('should highlight the hosts sidebar entry', () => {
      cy.get('.tn-menu-item[href="/hosts"]')
        .invoke('attr', 'aria-current')
        .should('eq', 'page');
    });
    it('should show 10 of the 27 registered hosts', () => {
      cy.get('.tn-hostname').its('length').should('eq', 10);
    });
    it('should have 3 pages', () => {
      cy.get('.tn-page-item').its('length').should('eq', 3);
    });
    it('should show the ip addresses, provider and agent version data for the hosts in the 1st page', () => {
      cy.get('.container').eq(0).as('hostsTable');
      availableHosts1stPage.forEach((host, index) => {
        cy.get('@hostsTable')
          .find('tr')
          .eq(index + 1)
          .find('td')
          .as('hostRow');

        cy.get('@hostsTable')
          .contains('th', 'IP')
          .invoke('index')
          .then((i) => {
            host.ipAddresses.forEach((ipAddress) => {
              cy.get('@hostRow').eq(i).should('contain', ipAddress);
            });
          });

        cy.get('@hostsTable')
          .contains('th', 'Provider')
          .invoke('index')
          .then((i) => {
            cy.get('@hostRow').eq(i).should('contain', host.provider);
          });

        cy.get('@hostsTable')
          .contains('th', 'Agent version')
          .invoke('index')
          .then((i) => {
            cy.get('@hostRow')
              .eq(i)
              .should('contain', host.agentVersion.slice(0, 15));
          });
      });
    });
    it('should link to the correct host details page clicking in the host name', () => {
      cy.get('.container').eq(0).as('hostsTable');
      availableHosts1stPage.forEach((host, index) => {
        cy.get('@hostsTable')
          .find('tr')
          .eq(index + 1)
          .find('td')
          .as('hostRow');

        cy.get('@hostsTable')
          .contains('th', 'Hostname')
          .invoke('index')
          .then((i) => {
            cy.get('@hostRow').eq(i).should('contain', host.name);
            cy.get('@hostRow').eq(i).click();
            cy.location('pathname').should('eq', `/hosts/${host.id}`);
            cy.go('back');
          });
      });
    });
    it('should link to the correct cluster details page clicking in the cluster name', () => {
      cy.get('.container').eq(0).as('hostsTable');
      availableHosts1stPage.forEach((host, index) => {
        cy.get('@hostsTable')
          .find('tr')
          .eq(index + 1)
          .find('td')
          .as('hostRow');

        cy.get('@hostsTable')
          .contains('th', 'Cluster')
          .invoke('index')
          .then((i) => {
            if (host.clusterId) {
              cy.get('@hostRow').eq(i).should('contain', host.clusterName);
              cy.get('@hostRow').eq(i).click();
              cy.location('pathname').should(
                'eq',
                `/clusters/${host.clusterId}`
              );
              cy.go('back');
            } else {
              cy.get('@hostRow').eq(i).find('a').should('not.exist');
            }
          });
      });
    });
    it('should link to the correct sap system details page clicking in the sap system name', () => {
      cy.get('.container').eq(0).as('hostsTable');
      availableHosts1stPage.forEach((host, index) => {
        cy.get('@hostsTable')
          .find('tr')
          .eq(index + 1)
          .find('td')
          .as('hostRow');

        cy.get('@hostsTable')
          .contains('th', 'SID')
          .invoke('index')
          .then((i) => {
            if (host.clusterId) {
              cy.get('@hostRow').eq(i).should('contain', host.sapSystemSid);
              cy.get('@hostRow').eq(i).click();
              cy.location('pathname').should(
                'eq',
                `/databases/${host.sapSystemId}`
              );
              cy.go('back');
            } else {
              cy.get('@hostRow').eq(i).find('a').should('not.exist');
            }
          });
      });
    });
  });

  describe('Health Detection', () => {
    describe('Health Container shows the health overview of the deployed landscape', () => {
      before(() => {
        cy.visit('/hosts');
        cy.url().should('include', '/hosts');
        cy.task('startAgentHeartbeat', agents());
      });

      it('should show health status of the entire cluster of 27 hosts with partial pagination', () => {
        cy.get('.tn-health-container .tn-health-passing', {
          timeout: 15000,
        }).should('contain', 27);
        cy.get('.tn-health-container .tn-health-warning').should('contain', 0);
        cy.get('.tn-health-container .tn-health-critical').should('contain', 0);
      });

      it('should show a passing health on the hosts when the agents are sending the heartbeat', () => {
        cy.get('svg.fill-jungle-green-500').its('length').should('eq', 10);
      });
    });
    describe('Health is changed to critical when the heartbeat is not sent', () => {
      before(() => {
        cy.visit('/hosts');
        cy.task('stopAgentsHeartbeat');
      });
      it('should show health status of the entire cluster of 27 hosts with critical health', () => {
        cy.get('.tn-health-container .tn-health-critical', {
          timeout: 15000,
        }).should('contain', 27);
      });

      it('should show a critical health on the hosts when the agents are not sending the heartbeat', () => {
        cy.get('svg.fill-red-500').its('length').should('eq', 10);
      });
    });
  });

  describe('Deregistration', () => {
    const hostToDeregister = {
      name: 'vmdrbddev01',
      id: '240f96b1-8d26-53b7-9e99-ffb0f2e735bf',
    };

    describe('Clean-up buttons should be visible only when needed', () => {
      before(() => {
        cy.visit('/hosts');
        cy.url().should('include', '/hosts');
        cy.task('startAgentHeartbeat', [hostToDeregister.id]);
      });

      it(`should not display a clean-up button for host ${hostToDeregister.name}`, () => {
        cy.contains(hostToDeregister.name).within(() => {
          cy.get('td:nth-child(9)').should('not.exist');
        });
      });

      it('should show all other cleanup buttons', () => {
        for (let i = 2; i < 11; i++) {
          cy.get(`tr:nth-child(${i})`).within(() => {
            cy.get('[data-testid="cleanup-button"]').should('exist');
          });
        }
      });

      it(`should display the cleanup button for host ${hostToDeregister.name} once heartbeat is lost`, () => {
        cy.task('stopAgentsHeartbeat');

        cy.get('tr:nth-child(1) > .w-48 > [data-testid="cleanup-button"]', {
          timeout: 15000,
        }).should('exist');
      });
    });

    describe('Clean-up button should deregister a host', () => {
      before(() => {
        cy.visit('/hosts');
        cy.url().should('include', '/hosts');
        cy.task('stopAgentsHeartbeat');
      });

      it('should allow to deregister a host after clean up confirmation', () => {
        cy.get('tr:nth-child(1) > .w-48 > [data-testid="cleanup-button"]', {
          timeout: 15000,
        }).click();

        cy.get('.min-h-screen > .w-full').should(
          'contain.text',
          'This action will cause Trento to stop tracking all the components discovered by the agent in this host, including the host itself and any other component depending on it.'
        );

        cy.get('[data-testid="cleanup-confirm"]').click();

        cy.contains(hostToDeregister.name).should('not.exist');
      });
    });
  });
});

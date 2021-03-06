import PropTypes from "prop-types";
import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Radio from "react-bootstrap/lib/Radio";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import DropdownButton from "react-bootstrap/lib/DropdownButton";

import Button from "../../ui/components/Button";
import MenuItem from "react-bootstrap/lib/MenuItem";
import Alert from "react-bootstrap/lib/Alert";

const AVAILABLE_STATUS = {
  PASSED: "Succès",
  FAILED: "Échec",
  NOT_RUN: "Non joué",
  PENDING: "En attente"
};

export default class UpdateScenarioStateDialog extends React.PureComponent {
  static propTypes = {
    show: PropTypes.bool.isRequired,
    scenario: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onUpdateState: PropTypes.func.isRequired,
    tags: PropTypes.array,
    config: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = this.createDefaultStateFromProps(props);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.scenario !== this.props.scenario) {
      this.setState(this.createDefaultStateFromProps(this.props));
    }
  }

  createDefaultStateFromProps({ scenario }) {
    let status = null;
    let analyseResult;
    let analyseAction;
    if (scenario) {
      status = scenario.status;
      analyseResult = scenario.analyseResult ? scenario.analyseResult : null;
      analyseAction = scenario.analyse ? scenario.analyse : "";
    }
    return {
      scenario: {
        status,
        reviewed: true,
        analyseResult,
        analyseAction
      },
      comment: "",
      isAnalyseResultValid: false,
      isAnalyseActionValid: false,
      showValidation: false
    };
  }

  onCloseClick = event => {
    if (event) {
      event.preventDefault();
    }
    this.props.onClose();
  };

  isFormValid() {
    const { isAnalyseActionValid, isAnalyseResultValid } = this.state;
    if (this.state.status === "PENDING") {
      return isAnalyseResultValid;
    }
    return isAnalyseActionValid && isAnalyseResultValid;
  }

  onUpdateState = event => {
    if (event) {
      event.preventDefault();
    }

    const valid = this.isFormValid();
    if (!valid) {
      this.setState(prevState => {
        return {
          ...prevState,
          showValidation: true
        };
      });
      return;
    }

    this.props.onUpdateState({
      scenarioId: this.props.scenario.id,
      newState: this.state.scenario,
      comment: this.state.comment,
      analyseAction: this.state.analyseAction,
      analyseResult: this.state.analyseResult
    });
    this.props.onClose();
  };

  isStatusSelected = status => {
    return this.state.scenario.status === status;
  };

  onStatusSelected = status => {
    return () => {
      this.setState(prevState => {
        return {
          ...prevState,
          scenario: {
            ...prevState.scenario,
            status,
            analyseAction: ""
          },
          isAnalyseActionValid: status === "PENDING"
        };
      });
    };
  };

  isActionSelected = analyseAction => {
    return this.state.scenario.analyseAction === analyseAction;
  };

  onActionSelected = analyseAction => {
    return () => {
      this.setState(prevState => {
        return {
          ...prevState,
          scenario: {
            ...prevState.scenario,
            analyseAction
          },
          isAnalyseActionValid: true
        };
      });
    };
  };

  onTypeSelected = analyseResult => {
    return () => {
      this.setState(prevState => {
        return {
          ...prevState,
          scenario: {
            ...prevState.scenario,
            analyseResult
          },
          isAnalyseResultValid: true
        };
      });
    };
  };

  onReviewedChange = () => {
    this.setState(prevState => {
      return {
        scenario: {
          ...prevState.scenario,
          reviewed: !prevState.scenario.reviewed
        }
      };
    });
  };

  onCommentChange = event => {
    const comment = event.target.value;
    this.setState({
      comment
    });
  };

  textCorrespondingToTag(analyseResult) {
    const analyseResultSelected = this.props.config.encounteredProblems.filter(
      tag => tag["shortLabel"] === analyseResult
    );
    return analyseResultSelected[0]["longLabel"];
  }

  render() {
    const { show, config } = this.props;
    const statusRadios = Object.keys(AVAILABLE_STATUS).map(status => {
      const label = AVAILABLE_STATUS[status];
      return (
        <Radio key={status} checked={this.isStatusSelected(status)} onChange={this.onStatusSelected(status)}>
          {label}
        </Radio>
      );
    });

    const setOfActions = config.correctionActionConfig ? config.correctionActionConfig : [];
    const actionRadios = setOfActions
      .filter(action => action.type === this.state.scenario.status)
      .map(action => {
        const { actionLabel, actionCode } = action;
        return (
          <Radio
            key={actionCode}
            checked={this.isActionSelected(actionCode)}
            onChange={this.onActionSelected(actionCode)}
          >
            {actionLabel}
          </Radio>
        );
      });

    const t = config.encounteredProblems ? config.encounteredProblems : [];
    const analyseResultSelect = t.map(tag => {
      const type = tag["shortLabel"];
      const text = tag["longLabel"];
      return (
        <MenuItem key={type} eventKey={type} onSelect={this.onTypeSelected(type)}>
          {text}
        </MenuItem>
      );
    });

    return (
      <Modal bsSize="large" show={show} onHide={this.onCloseClick}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier le statut du scénario&hellip;</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={this.onUpdateState}>
            <FormGroup>
              <ControlLabel>Nouveau statut</ControlLabel>
              {statusRadios}
            </FormGroup>
            <FormGroup>
              <ControlLabel>Analyse du scénario</ControlLabel>
              <Checkbox checked={this.state.scenario.reviewed} onChange={this.onReviewedChange}>
                Scénario analysé ?
              </Checkbox>
            </FormGroup>
            {this.props.config.encounteredProblems ? (
              <FormGroup>
                <ControlLabel>Quel était le problème?</ControlLabel>
                {this.state.showValidation && !this.state.isAnalyseResultValid ? (
                  <Alert bsStyle="danger">Requis</Alert>
                ) : null}
                <div>
                  <DropdownButton
                    title={
                      this.state.scenario.analyseResult
                        ? this.textCorrespondingToTag(this.state.scenario.analyseResult)
                        : "Sélectionnez un type d'anomalie"
                    }
                    key="dropdownanalyseResultAnalyse"
                    id="dropdownanalyseResultAnalyse"
                  >
                    {analyseResultSelect}
                  </DropdownButton>
                </div>
              </FormGroup>
            ) : null}
            <FormGroup>
              {this.state.scenario.status !== "PENDING" ? <ControlLabel>Action effectuée</ControlLabel> : null}
              {this.state.showValidation && !this.state.isAnalyseActionValid ? (
                <Alert bsStyle="danger">Requis</Alert>
              ) : null}
              {actionRadios}
            </FormGroup>
            <FormGroup controlId="comment">
              <ControlLabel>Commentaire</ControlLabel>
              <FormControl
                componentClass="textarea"
                rows="3"
                value={this.state.comment}
                onChange={this.onCommentChange}
              />
            </FormGroup>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onCloseClick}>Annuler</Button>
          <Button bsStyle="primary" onClick={this.onUpdateState}>
            Valider
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

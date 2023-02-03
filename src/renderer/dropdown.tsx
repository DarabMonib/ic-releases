// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import ReactDOM from 'react-dom';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';
import {DragDropContext, Draggable, DraggingStyle, Droppable, DropResult, NotDraggingStyle} from 'react-beautiful-dnd';

import {Team, TeamWithTabs} from 'types/config';

import {
    CLOSE_TEAMS_DROPDOWN,
    REQUEST_TEAMS_DROPDOWN_INFO,
    SEND_DROPDOWN_MENU_SIZE,
    SHOW_NEW_SERVER_MODAL,
    SHOW_EDIT_SERVER_MODAL,
    SHOW_REMOVE_SERVER_MODAL,
    SWITCH_SERVER, UPDATE_TEAMS,
    UPDATE_TEAMS_DROPDOWN,
    SET_ACTIVE_VIEW,
    OPEN_NATIVE_TEAMS
} from 'common/communication';
import {getTabViewName} from 'common/tabs/TabView';
import {TAB_BAR_HEIGHT, THREE_DOT_MENU_WIDTH_MAC} from 'common/utils/constants';

import './css/dropdown.scss';

import IntlProvider from './intl_provider';

type State = {
    teams?: TeamWithTabs[];
    orderedTeams?: TeamWithTabs[];
    activeTeam?: string;
    darkMode?: boolean;
    enableServerManagement?: boolean;
    unreads?: Map<string, boolean>;
    mentions?: Map<string, number>;
    expired?: Map<string, boolean>;
    hasGPOTeams?: boolean;
    isAnyDragging: boolean;
    windowBounds?: Electron.Rectangle;
    hoverBtn: number;
}

function getStyle(style?: DraggingStyle | NotDraggingStyle) {
    if (style?.transform) {
        const axisLockY = `translate(0px${style.transform.slice(style.transform.indexOf(','), style.transform.length)}`;
        return {
            ...style,
            transform: axisLockY,
        };
    }
    return style;
}
class TeamDropdown extends React.PureComponent<Record<string, never>, State> {
    buttonRefs: Map<number, HTMLButtonElement>;
    addServerRef: React.RefObject<HTMLButtonElement>;
    focusedIndex: number | null;

    constructor(props: Record<string, never>) {
        super(props);
        this.state = {
            isAnyDragging: false,
            hoverBtn: 0,
        };
        this.focusedIndex = null;

        this.buttonRefs = new Map();
        this.addServerRef = React.createRef();
        window.addEventListener('message', this.handleMessageEvent);
    }

    handleMessageEvent = (event: MessageEvent) => {
        if (event.data.type === UPDATE_TEAMS_DROPDOWN) {
            const {teams, activeTeam, darkMode, enableServerManagement, hasGPOTeams, unreads, mentions, expired, windowBounds} = event.data.data;
            this.setState({
                teams,
                orderedTeams: teams.concat().sort((a: TeamWithTabs, b: TeamWithTabs) => a.order - b.order),
                activeTeam,
                darkMode,
                enableServerManagement,
                hasGPOTeams,
                unreads,
                mentions,
                expired,
                windowBounds,
            });
        }
    }

    selectServer = (team: Team) => {
        return () => {
            window.postMessage({type: SWITCH_SERVER, data: team.name}, window.location.href);
            this.closeMenu();
        };
    }

    closeMenu = () => {
        if (!this.state.isAnyDragging) {
            (document.activeElement as HTMLElement).blur();
            window.postMessage({type: CLOSE_TEAMS_DROPDOWN}, window.location.href);
        }
    }

    preventPropogation = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    }

    addServer = () => {
        window.postMessage({type: SHOW_NEW_SERVER_MODAL}, window.location.href);
        this.closeMenu();
    }

    isActiveTeam = (team: Team) => {
        return team.name === this.state.activeTeam;
    }

    onDragStart = () => {
        this.setState({isAnyDragging: true });
    }

    onDragEnd = (result: DropResult) => {
        const removedIndex = result.source.index;
        const addedIndex = result.destination?.index;
        if (addedIndex === undefined || removedIndex === addedIndex) {
            this.setState({isAnyDragging: false});
            return;
        }
        if (!this.state.teams) {
            throw new Error('No config');
        }
        const teams = this.state.teams.concat();
        const tabOrder = teams.map((team, index) => {
            return {
                index,
                order: team.order,
            };
        }).sort((a, b) => (a.order - b.order));

        const team = tabOrder.splice(removedIndex, 1);
        const newOrder = addedIndex < this.state.teams.length ? addedIndex : this.state.teams.length - 1;
        tabOrder.splice(newOrder, 0, team[0]);

        tabOrder.forEach((t, order) => {
            teams[t.index].order = order;
        });
        this.setState({teams, orderedTeams: teams.concat().sort((a: Team, b: Team) => a.order - b.order), isAnyDragging: false});
        window.postMessage({type: UPDATE_TEAMS, data: teams}, window.location.href);
    }

    componentDidMount() {
        window.postMessage({type: REQUEST_TEAMS_DROPDOWN_INFO}, window.location.href);
        window.addEventListener('click', this.closeMenu);
        window.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    componentDidUpdate() {
        window.postMessage({type: SEND_DROPDOWN_MENU_SIZE, data: {width: document.body.scrollWidth, height: document.body.scrollHeight}}, window.location.href);
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.closeMenu);
        window.removeEventListener('keydown', this.handleKeyboardShortcuts);
    }

    setButtonRef = (teamIndex: number, refMethod?: (element: HTMLButtonElement) => any) => {
        return (ref: HTMLButtonElement) => {
            this.addButtonRef(teamIndex, ref);
            refMethod?.(ref);
        };
    }

    addButtonRef = (teamIndex: number, ref: HTMLButtonElement | null) => {
        if (ref) {
            this.buttonRefs.set(teamIndex, ref);
            ref.addEventListener('focusin', () => {
                this.focusedIndex = teamIndex;
            });
            ref.addEventListener('blur', () => {
                this.focusedIndex = null;
            });
        }
    }

    handleKeyboardShortcuts = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            if (this.focusedIndex === null) {
                this.focusedIndex = 0;
            } else {
                this.focusedIndex = (this.focusedIndex + 1) % this.buttonRefs.size;
            }
            this.buttonRefs.get(this.focusedIndex)?.focus();
        }
        if (event.key === 'ArrowUp') {
            if (this.focusedIndex === null || this.focusedIndex === 0) {
                this.focusedIndex = this.buttonRefs.size - 1;
            } else {
                this.focusedIndex = (this.focusedIndex - 1) % this.buttonRefs.size;
            }
            this.buttonRefs.get(this.focusedIndex)?.focus();
        }
        if (event.key === 'Escape') {
            this.closeMenu();
        }
        this.buttonRefs.forEach((button, index) => {
            if (event.key === String(index + 1)) {
                button.focus();
            }
        });
    }

    handleClickOnDragHandle = (event: React.MouseEvent<HTMLDivElement>) => {
        if (this.state.isAnyDragging) {
            event.stopPropagation();
        }
    }

    editServer = (team: string) => {
        return (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            window.postMessage({type: SHOW_EDIT_SERVER_MODAL, data: {name: team}}, window.location.href);
            this.closeMenu();
        };
    }

    removeServer = (team: string) => {
        return (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            window.postMessage({type: SHOW_REMOVE_SERVER_MODAL, data: {name: team}}, window.location.href);
            this.closeMenu();
        };
    }

    render() {
        return (
            <IntlProvider>
                <div
                    // onClick={this.preventPropogation}
                    className={classNames('TeamDropdown', {
                        darkMode: false, //this.state.darkMode, ---EXTREMELY IMPORTANT MUST BE RE CONFIGURED AFTER DEMO---
                    })}
                    style={{
                        maxHeight: this.state.windowBounds ? (this.state.windowBounds.height - TAB_BAR_HEIGHT - 16) : undefined,
                        maxWidth: this.state.windowBounds ? (this.state.windowBounds.width - THREE_DOT_MENU_WIDTH_MAC) : undefined,
                    }}
                >
                    <div
                        // open Modal!

                        // TODO:
                        // Add isDarkMode back..
                        style={{ width: '268px', color: this.state.hoverBtn === 1 ? "white" : "gray", cursor: 'pointer', padding: ' 11px 16px 11px 16px', backgroundColor: this.state.hoverBtn === 1 ? '#3476DC': 'white' }}
                        onClick={this.addServer}
                        onMouseEnter={() => this.setState({ hoverBtn: 1 })}
                        onMouseLeave={() => this.setState({ hoverBtn: 0 })}
                    >
                        Sign in to another workspace
                    </div>
                    <div
                        // redirect to ${baseUrl}/select_team
                        style={{ width: '268px', color: this.state.hoverBtn === 2 ? "white" : "gray" , cursor: 'pointer', padding: ' 11px 16px 11px 16px', backgroundColor: this.state.hoverBtn === 2 ? '#3476DC': 'white' }}
                        onClick={() => {
                            window.postMessage({type: OPEN_NATIVE_TEAMS, data: '/select_team'}, window.location.href);
                        }}
                        onMouseEnter={() => this.setState({ hoverBtn: 2 })}
                        onMouseLeave={() => this.setState({ hoverBtn: 0 })}
                    >
                        Explore Teams
                    </div>
                </div>
            </IntlProvider>
        );
    }
}

ReactDOM.render(
    <TeamDropdown/>,
    document.getElementById('app'),
);

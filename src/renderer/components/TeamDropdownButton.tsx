// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useEffect} from 'react';
import {FormattedMessage} from 'react-intl';

import {CLOSE_TEAMS_DROPDOWN, OPEN_TEAMS_DROPDOWN} from 'common/communication';

import '../css/components/TeamDropdownButton.scss';

type Props = {
    isDisabled?: boolean;
    activeServerName?: string;
    activeServerURL?: string;
    totalMentionCount: number;
    hasUnreads: boolean;
    isMenuOpen: boolean;
    darkMode: boolean;
    plusPos: any;
}

const TeamDropdownButton: React.FC<Props> = (props: Props) => {
    const {isDisabled, activeServerName, totalMentionCount, hasUnreads, isMenuOpen, darkMode, plusPos} = props;
    const buttonRef: React.RefObject<HTMLButtonElement> = React.createRef();

    useEffect(() => {
        if (!isMenuOpen) {
            buttonRef.current?.blur();
        }
    }, [isMenuOpen]);

    const handleToggleButton = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        window.ipcRenderer.send(isMenuOpen ? CLOSE_TEAMS_DROPDOWN : OPEN_TEAMS_DROPDOWN);
    };

    let badgeDiv: React.ReactNode;
    if (totalMentionCount > 0) {
        badgeDiv = (
            <div className='TeamDropdownButton__badge-count'>
                <span>{totalMentionCount > 99 ? '99+' : totalMentionCount}</span>
            </div>
        );
    } else if (hasUnreads) {
        badgeDiv = (
            <div className='TeamDropdownButton__badge-unreads'/>
        );
    }

    const removeDefault = {	
        background: 'none',
        border: 'none',
        font: 'inherit',
        cursor: 'pointer',
        outline: 'inherit'
    }

    return (
        <button
            ref={plusPos}
            disabled={isDisabled}
            style={{ color: 'white', paddingLeft: 11, borderRadius: 10, width: 40, textAlign: 'center', ...removeDefault }}
            // className={classNames('TeamDropdownButton', {
            //     disabled: isDisabled,
            //     isMenuOpen,
            //     darkMode,
            // })}
            onClick={handleToggleButton}
            onDoubleClick={(event) => {
                event.stopPropagation();
            }}
        >
            {/* <div className='TeamDropdownButton__badge'>
                <i className='icon-server-variant'/>
                {badgeDiv}
            </div>
            {activeServerName && <span>{activeServerName}</span>}
            {!activeServerName &&
                <FormattedMessage
                    id='renderer.components.teamDropdownButton.noServersConfigured'
                    defaultMessage='No servers configured'
                />
            }
            <i className='icon-chevron-down'/> */}
            <i style={{ fontSize: '24px' }} className="icon icon-plus" role="img" aria-label="Plus Icon"></i>
        </button>
        
    );
};

export default TeamDropdownButton;

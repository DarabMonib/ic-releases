// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import classNames from 'classnames';

import Logo from 'renderer/components/Logo';

import 'renderer/css/components/Header.scss';

type HeaderProps = {
    alternateLink?: React.ReactElement;
    darkMode?: boolean;
}

const Header = ({
    alternateLink,
    darkMode,
}: HeaderProps) => (
    <div
        style={{ opacity: 0 }}
        className={classNames(
            'Header',
            {'Header--darkMode': darkMode},
        )}
    >
        <div className='Header__main'>
            <div className='Header__logo'>
                <Logo/>
            </div>
            {alternateLink}
        </div>
    </div>
);

export default Header;

// eslint-disable-next-line import/named
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import $ from 'jquery';
import React, { FC, memo, useEffect, useRef } from 'react';

export type TTooltipProps = {
	icon?: IconProp;
	isHtml?: boolean;
	message: string;
	placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
};

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const Tooltip: FC<TTooltipProps> = ({
	icon = ['fad', 'question-circle'],
	isHtml = false,
	message,
	placement = 'top',
}): JSX.Element => {
	const tooltipEl = useRef<HTMLSpanElement>(null);
	const tooltipPlacement = placement || 'top';

	useEffect(
		(): (() => void) => {
			let tooltipSpan: HTMLSpanElement | null = null;

			if (tooltipEl && tooltipEl.current) {
				tooltipSpan = tooltipEl.current;

				$(tooltipSpan).tooltip();
			}

			return (): void => {
				if (tooltipSpan) $(tooltipSpan).tooltip('dispose');
			};
		},
	);

	return (
		<span
			data-toggle="tooltip"
			data-placement={tooltipPlacement}
			title={message}
			data-html={isHtml}
			ref={tooltipEl}
		>
			<FontAwesomeIcon icon={icon} fixedWidth />
		</span>
	);
};

Tooltip.whyDidYouRender = true;

export default memo(Tooltip);

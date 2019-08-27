import React, { FC, memo } from 'react';

const FormError: FC<{}> = ({ children }): JSX.Element => (
	<div className="is-invalid invalid-feedback">{children}</div>
);

FormError.whyDidYouRender = true;

export default memo(FormError);

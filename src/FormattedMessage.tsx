import React from "react";

interface FormattedMessageProps {
  message: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ message }) => {
  const formattedMessage = message.split(/\\n/).map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
  /*
  const formattedMessage = message.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < message.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));
*/
  return <div>{formattedMessage}</div>;
};

export default FormattedMessage;

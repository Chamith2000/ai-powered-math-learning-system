import React from "react";

const CardHeader = ({ title }) => {
  return (
    <div className="card-header">
      <h5 className="card-title">{title}</h5>
    </div>
  );
};

export default CardHeader;

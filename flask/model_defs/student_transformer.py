import math
import torch
import torch.nn as nn
import pytorch_lightning as pl
from torchmetrics import MeanSquaredError, AUROC



class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=512):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]


class StudentTransformerModel(pl.LightningModule):
    def __init__(
        self,
        d_in,
        d_model=64,
        nhead=4,
        num_layers=2,
        dim_feedforward=128,
        dropout=0.1,
        lr=1e-3,
        max_len=128,
        pos_encoding=True,
    ):
        super().__init__()
        self.save_hyperparameters()

        self.input_proj = nn.Linear(d_in, d_model)
        self.pos_encoder = PositionalEncoding(d_model, max_len) if pos_encoding else nn.Identity()

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        self.score_head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.Linear(d_model, 1),
        )
        self.diff_head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.Linear(d_model, 1),
        )
        self.improve_head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.Linear(d_model, 1),
        )

        self.mse_score = MeanSquaredError()
        self.mse_diff = MeanSquaredError()
        self.auroc = AUROC(task="binary")

        self.lr = lr

    def forward(self, x):
        # x: [batch, seq_len, d_in]
        h = self.input_proj(x)
        h = self.pos_encoder(h)
        h = self.encoder(h)  # [batch, seq_len, d_model]
        h_last = h[:, -1, :]  # use last token

        y_score = self.score_head(h_last).squeeze(-1)
        y_diff = self.diff_head(h_last).squeeze(-1)
        y_improve_logit = self.improve_head(h_last).squeeze(-1)

        return y_score, y_diff, y_improve_logit

